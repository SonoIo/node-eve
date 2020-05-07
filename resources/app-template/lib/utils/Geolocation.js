import _ from "underscore";
import { Events } from "backbone";


export default class Geolocation {

	static middleware(options) {
		return function (ctx, next) {
			ctx.geolocation = new Geolocation(options);
			return next();
		};
	}

	constructor(options){
		this.options = _.defaults(options||{}, {
			maximumAge: 5 * 1000,
			timeout: 5 * 1000,
			enableHighAccuracy: false,
			forceEnabled: false
		});
		this._enabled         = this.enabled();
		this._watchHandler    = null;
		this._currentPosition = {
			latitude: null,
			longitude: null
		};
	}

	/**
	 * L'utente dichiara di abilitare la geolocalizzazione
	 * @return {Geolocation}
	 */
	enable(){
		window.localStorage.setItem("geolocation", true);
		this._enabled = true;
		this.trigger('geolocation:enabled', true);
	}

	/**
	 * L'utente dichiara di disabilitare la geolocalizzazione
	 * @return {Geolocation}
	 */
	disable(){
		window.localStorage.setItem("geolocation", false);
		this._enabled = false;
		this.trigger('geolocation:enabled', false);
	}

	/**
	 * Controlla se la geolocalizzazione è abilitata
	 * @return {Boolean}
	 */
	enabled(){
		if ( _.isUndefined(this._enabled) || _.isNull(this._enabled) ){
			let e;
			try{
				e = JSON.parse(window.localStorage.getItem("geolocation"));
				if ( _.isNull(e) || _.isUndefined(e) || _.isNaN() || !_.isBoolean(e))
					e = false;
			}catch(e){
				e = false;
			}

			this._enabled = e;
		}

		return this._enabled;
	}

	getLastKnownPosition() {
		return this._currentPosition;
	}

	getCurrentPosition(options, done) {
		if ( _.isFunction(options) ){
			done    = options;
			options = {};
		}

		if (!_.isFunction(done)) done = ()=>{};

		options = _.defaults( options || {}, this.options );

		// Controllo se l'utente ha dato il suo consenso
		if ( !this.enabled() && !options.forceEnabled ){
			let err = new Error("PERMISSION_DENIED");
			err.code = 1;
			return done(err);
		}

		window.navigator.geolocation.getCurrentPosition(
			(position) => {
				let lat = position.coords.latitude; // Math.floor(position.coords.latitude * 1000) / 1000;
				let lng = position.coords.longitude; // Math.floor(position.coords.longitude * 1000) / 1000;
				if (lat != this._currentPosition.latitude || lng != this._currentPosition.longitude) {
					this._currentPosition = {
						latitude: lat,
						longitude: lng
					};
					this.trigger('change', this._currentPosition);
				}
				return done(null, this._currentPosition);
			},
			(err) => {
				if ( err && err.toString() == "[object PositionError]" && err.code == 1 )
					this.disable();
				return done(err);
			},
			options
		);
	}

	watchPosition(options) {
		if (this.isWatchingPosition())
			return;
		options = _.defaults( options || {}, this.options );
		this._watchHandler = window.navigator.geolocation.watchPosition(_.bind(this._updateCurrentPosition, this), _.bind(this._handleError, this), options);
	}

	clearWatch() {
		if (this._watchHandler){
			window.navigator.geolocation.clearWatch(this._watchHandler);
			this._watchHandler = null;
		}

	}

	isWatchingPosition() {
		return this._watchHandler !== null;
	}

	humanize(distance) {
		let km = Math.floor(distance);
		let m = Math.floor((distance - km) * 1000);
		let result = [];
		if (km > 0)
			result.push(km + 'km');
		else {
			if (m > 0)
				result.push(m + 'm');
		}
		return result.join(' ');
	}

	_updateCurrentPosition(position) {
		// Reduce the precision
		let lat = Math.floor(position.coords.latitude * 1000) / 1000;
		let lng = Math.floor(position.coords.longitude * 1000) / 1000;

		if (lat != this._currentPosition.latitude || lng != this._currentPosition.longitude) {
			this._currentPosition = {
				latitude: lat,
				longitude: lng
			};
			this.trigger('change', this._currentPosition);
		}
	}

	_handleError(err) {
		this.trigger('error', err);
	}

}

_.extend(Geolocation.prototype, Events );
