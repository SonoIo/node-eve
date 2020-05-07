import _ from "underscore";
import context from "context-utils";
import { Events } from "backbone";
import {waterfall} from "async";
import Geolocation from "./Geolocation";

const METHOD_TYPE_PROMPT_NATIVE_REQUEST = 0;
const METHOD_TYPE_CHECK_STATUS = 1;

export default class GeolocationPlugin extends Geolocation {

	static middleware(options) {
		return function (ctx, next) {
			ctx.geolocation = new GeolocationPlugin(options);
			return next();
		};
	}

	constructor(options){
		super(options);

		this.methods          = {};
		this.locationAccuracy = null;
		this.diagnostic       = null;

		if ( window.cordova && window.cordova.plugins && window.cordova.plugins.locationAccuracy){
			this.locationAccuracy = window.cordova.plugins.locationAccuracy;
		}

		if ( window.cordova && window.cordova.plugins && window.cordova.plugins.diagnostic){
			this.diagnostic = window.cordova.plugins.diagnostic;
		}

		this.pluginRequested  = null;
		this.pluginAvailable  = null;
		this.pluginEnabled    = null;
		this.pluginAuthorized = null;

		this.listenTo(context.pubsub, 'resume', this.onResume);
	}

	/**
	 * Registra un metodo di callback per far eseguire al plugin una istruzione dopo un deterinato evento.
	 * @public
	 * @version 1.0.0
	 * @param {String} type - Node del metodo
	 * @param {Function} method - Metodo di callback
	 * @return {GeolocationPlugin}
	 */
	register(type, method){
		if ( _.isUndefined(type) || _.isNull(type) ) throw new Error('The type is mandatory');
		if (!this.methods[type]) this.methods[type] = [];
		if (!_.isFunction(method)) return this;

		const methods = this.methods[type];

		if ( _(methods).indexOf(method) > -1 )
			return this;

		methods.push( method );

		return this;
	}

	/**
	 * Evento di riativazione dell'applicazione dal background
	 * @version 1.0.0
	 */
	onResume(){
		this.checkState();
	}

	/**
	 * Controlla se la geolocalizzazione è abilitata
	 * @return {Boolean}
	 */
	enabled(){
		super.enabled();
		if ( this.diagnostic ){
			this._enabled = this.pluginEnabled && this.pluginAvailable && this.pluginAuthorized;
		}

		return this._enabled;
	}

	/**
	 * Visualizza il messaggio nativo per richiedere la posizione
	 * @version 1.0.0
	 * @param {Function} done - Function
	 */
	promptNativeRequest(done){
		if(!_.isFunction(done)) done = ()=>{};
		if ( this.pluginRequested || ( !_.isNull(this.pluginRequested) && !this.pluginAuthorized) )
			return done(null, true);

		if (!this.diagnostic){
			return done(null, false);
		}

		const methods = this.methods[METHOD_TYPE_PROMPT_NATIVE_REQUEST] || [];
		this.diagnostic.requestLocationAuthorization(
			(status)=>{
				let granted = false;
				switch(status){
					case this.diagnostic.permissionStatus.GRANTED:
						granted = true;
					break;
					case this.diagnostic.permissionStatus.DENIED:
					case this.diagnostic.permissionStatus.NOT_REQUESTED:
					case this.diagnostic.permissionStatus.DENIED_ALWAYS:
					default:
						granted = false;
					break;
				}

				this.enable(granted);
				_(methods).each((method)=>{
					method(null, granted);
				});

				return done(null, granted);
			},
			(err)=>{
				_(methods).each((method)=>{
					method(err);
				});
				return done(err);
			}, cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);

	}

	/**
	 * Controllo se i permessi nativi per l'applicazione
	 * @public
	 * @version 1.0.0
	 * @param {Function} done - Callback
	 */
	checkState(done){
		if(!_.isFunction(done)) done = ()=>{};
		let output = {
			requested:  this.pluginRequested,
			available:  this.pluginAvailable,
			enabled:    this.pluginEnabled,
			authorized: this.pluginAuthorized
		};

		if ( !window.cordova ){ // global.env.APP_ENV == 'development' &&
			return done(null, {
				requested:  true,
				available:  true,
				enabled:    true,
				authorized: true
			});
		}

		waterfall([
			// Controllo se è aviable
			(next)=>{
				// Se non è stato ancora richiesto vado avanti
				this.isLocationAvailable((err, value)=>{
					output.available = value;
					return next();
				})
			},
			// Controllo se è abilitato, è un check aggiuntivo al is aviable
			(next)=>{
				// Se non è stato ancora richiesto vado avanti
				this.isLocationEnabled((err, value)=>{
					output.enabled = value;
					return next();
				})
			},
			// Controllo se è autorizzato
			(next)=>{
				this.isLocationAuthorized((err, value)=>{
					output.authorized = value;
					return next();
				})
			},
			// Controllo se è stato richiesto
			(next)=>{
				if ( !output.authorized || !output.available  ) {
					output.authorized = null;
					return next();
				}
				this.canRequest((err, value)=>{
					output.requested = value ? true : false;
					return next();
				});
			}

		], (err)=>{

			const methods = this.methods[METHOD_TYPE_CHECK_STATUS] || [];
			// BUG di ios
			if ( output.authorized && output.available && output.enabled  )
				output.requested = true;

			_(methods).each((method)=>{
				method(err, output);
			});

			return done(err, output);
		});

	}

	/**
	 * Controlla se è stato promptato il popup nativo
	 * @version 1.0.0
	 * @param {Function} done - Callback
	 */
	canRequest(done){
		if(!_.isFunction(done)) done = ()=>{};

		if (!this.locationAccuracy){
			this.pluginRequested = false;
			return done();
		}

		this.locationAccuracy.canRequest((canRequest)=>{
			// per un bug del plugin in iOS che restituice sempre zero
			// if ( utils.hasBeenStarted() ){
			// 	canRequest = false;
			// }else{
			// 	canRequest = true;
			// }
			this.pluginRequested = canRequest;// context.device.isIos() ? canRequest : canRequest;
			return done(null, this.pluginRequested);
		});
	}

	/**
	 *
	 */
	isLocationAvailable(done){
		if(!_.isFunction(done)) done = ()=>{};

		if (!this.diagnostic){
			this.pluginAvailable = false;
			return done();
		}

		this.diagnostic.isLocationAvailable((available)=>{
			this.pluginAvailable = available;
			return done(null, available);
		},(err)=>{
			this.pluginAvailable = false;
			return done(err);
		});
	}

	/**
	 * Controlla se è abilitato lato nativo
	 * @public
	 * @version 1.0.0
	 * @param {Boolean} force - Forza il check
	 * @param {Function} done - Callback
	 */
	isLocationEnabled(done){
		if(!_.isFunction(done)) done = ()=>{};

		if (!this.diagnostic){
			this.pluginEnabled = false;
			return done();
		}

		this.diagnostic.isLocationEnabled((enabled)=>{
			this.pluginEnabled = enabled;
			return done(null, enabled);
		}, (err)=>{
			this.pluginEnabled = false;
			return done(err);
		});
	}

	/**
	 *
	 */
	isLocationAuthorized(done){
		if(!_.isFunction(done)) done = ()=>{};

		if (!this.diagnostic){
			this.pluginAuthorized = false;
			return done();
		}

		this.diagnostic.isLocationAuthorized((authorized)=>{
			this.pluginAuthorized = authorized;
			return done(null, authorized);
		},(err)=>{
			this.pluginAuthorized = false;
			return done(err);
		});
	}

}


GeolocationPlugin.METHOD_TYPE_PROMPT_NATIVE_REQUEST = METHOD_TYPE_PROMPT_NATIVE_REQUEST;
GeolocationPlugin.METHOD_TYPE_CHECK_STATUS = METHOD_TYPE_CHECK_STATUS;
