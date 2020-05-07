import _                  from 'underscore';
import $                  from 'jquery';
import Backbone           from 'backbone';
import BackboneTouch      from 'backbone.touch';
import context            from 'context-utils';
import Device             from 'device-utils';
import Cache              from 'cache-utils';
import Settings           from 'settings-utils';
import Search             from 'search-utils';
import Page               from 'page-utils';
import Network            from 'network-utils';
import PubSub             from 'backbone.pubsub';
import Viewstack          from 'backbone.viewstack';
import { waterfall }      from 'async';
import { State }          from 'backbone.uikit';
import { l, Performance } from "./index";

export default class Application {

	constructor(options) {
		if (context.app)
			throw new Error('Cannot initialize more than one app');

		// Set the app reference on the context
		context.app = this;

		this.options = _.defaults(options || {}, {
			// tabs: false, // TODO
			applicationElement: '#application',
			translations: {},
			defaultLanguage: 'it',
			lockAndroidOrientation: true,
			pushState: false
		});

		// App info will be sotred here
		this.info = {
			manufator: '',
			description: '',
			identifier: '',
			version: '',
			build: ''
		};

		this.page = new Page();
		this.boot();
	}

	boot() {
		Performance.measure('BOOT');
		const page = this.page;

		// Backbone
		Backbone.$ = $;

		// Globals
		global.env = {};
		let config = require('../../config.json');
		for (let key in config) {
			global.env[key] = config[key];
		}
		global.env.APP_ENV = global.env.env;

		// Imposto le informazioni base di default
		this.info.manufator   = config['author'];
		this.info.description = config['description'];
		this.info.version     = config['version']||'';

		// Dev mode
		if (global.env.env === 'development') {
			window._ctx   = context;
			window._$     = $;
		}

		// Context vars
		context.collections = {};
		context.models = {};
		context.views = {};

		// Before boot
		this.onBeforeBoot(context, page);

		// Middlewares
		page.use(this.measurePerformanceMiddleware('boot middlewares'));
		page.use(Device.middleware());
		page.use(Cache.middleware());
		page.use(PubSub.middleware());
		page.use(Settings.middleware());
		page.use(Network.middleware({ backbone: Backbone }));
		page.use(Viewstack.middleware({ el: this.options.applicationElement }));
		page.use((context, next) => {
			let state = context.state = new State();
			state.set('viewstack', context.viewstack);
			state.set('main', true);
			return next();
		});
		page.use(this.measurePerformanceMiddleware('boot middlewares'));

		// Carica i Fonts
		page.use(this.measurePerformanceMiddleware('load fonts'));
		page.use((context, next) => {
			if ( document.fonts && document.fonts.load &&_.isObject(global.env.FONTS) ){
				var actions = [];
				_(global.env.FONTS).each((fontWeights, fontName) => {
					if ( !fontWeights || !_.isArray(fontWeights) || fontWeights.length == 0 )
						fontWeights = ['normal'];

					_(fontWeights).each((fontWeight)=>{
						actions.push((cb) => {
							document.fonts
								.load( `${fontWeight} 6px "${fontName}"`, `cariamento font ${fontName} ${fontWeight} ...` )
								.then(() => {
									// console.log(`Font "${fontName} ${fontWeight}" is ready!`);
									return cb();
								});
						});
					});


				});
				waterfall(actions, (err) => {
					return next();
				});
			} else {
				return next();
			}
		});
		page.use(this.measurePerformanceMiddleware('load fonts'));

		// TODO: Appendere se è un dispositivo con performace oppure no
		page.use(this.measurePerformanceMiddleware('check device performance'));
		page.use((context, next) => {
			const device        = context.device;
			const currentDevice = device.getOS();

			// document.documentElement.classList.add( 'normal-performance');
			if ( (device.isAndroid() && currentDevice.version < 5) || device.isWindowsPhone() ) {
				document.documentElement.classList.add( 'low-performance');
			} else {
				document.documentElement.classList.add( 'high-performance');
			}

			return next();
		});
		page.use(this.measurePerformanceMiddleware('check device performance'));

		// Form scroll pan adjust
		page.use((context, next) => {
			if (global.env.SCROLL_PAN) {
				if (context.device.isIphoneX()) {
					global.env.SCROLL_PAN += 44;
				} else if (context.device.isIos()) {
					global.env.SCROLL_PAN += 20;
				}
			}
			return next();
		});

		// Install libraries
		this.onInstallLibraries(context, page);

		// Plugins
		page.use((context, next) => {

			if (!window.navigator.appInfo || !window.navigator.appInfo.getAppInfo)
				return next();

			window.navigator.appInfo.getAppInfo((appInfo) => {
				this.info.identifier = appInfo.identifier;
				this.info.version    = appInfo.version;
				this.info.build      = appInfo.build;
				// Normalize build version
				let build = this.info.build.toString();
				if ( _.isString(build) && build.length >= 7 && build.indexOf('.') == -1 ){
					let newBuild = build[0] + '.' +
						parseInt(build[1] + build[2] + build[3]).toString() + '.' +
						parseInt(build[4] + build[5] + build[6]).toString();

					let _buildVersion = "";
					for (var i = 7; i < build.length; i++) {
						_buildVersion += build[i];
					}
					if (!_.isEmpty(_buildVersion))
						newBuild += '.'+parseInt(_buildVersion).toString();

					this.info.build = newBuild;
				} else if ( context.device.isAndroid() ){
					this.info.build = build.substr(0, build.length - 1 ) + "/" + build[build.length-1];
				}

				return next();
			}, (err) => {
				return next();
			});

		});

		// Lockscreen
		page.use((context, next)=>{

			if ( window.screen &&  window.screen.lockOrientation ){
				if ( context.device.isAndroid() ){
					if ( context.device.isTablet() ){
						window.screen.unlockOrientation();
					}else if (this.options.lockAndroidOrientation) {
						context.cache.set('lockOrientation', 'portrait');
						window.screen.lockOrientation('portrait');
					}
				}
			}

			return next();
		});

		// Events
		page.use((context, next) => {
			// App resume and pause
			document.addEventListener('resume', () => {
				this.onResume(context);
				context.pubsub.trigger('resume');
			}, false);
			document.addEventListener('pause', () => {
				this.onPause(context);
				context.pubsub.trigger('pause');
			}, false);

			// Keyboard
			context.keyboard = { active: true };
			if (window.Keyboard && !_.isFunction(window.Keyboard)) {
				window.Keyboard.hideFormAccessoryBar(false);

				// window.cordova.plugins.Keyboard.disableScroll(true);
				context.keyboard = {
					active: false
				};
				window.addEventListener('keyboardDidShow', (e) => {
					context.keyboard.active = true;
					context.pubsub.trigger('keyboard:show', e);
				});
				window.addEventListener('keyboardDidHide', (e) => {
					context.keyboard.active = false;
					context.pubsub.trigger('keyboard:hide', e);
				});
				window.addEventListener('keyboardWillShow', (e) => {
					context.pubsub.trigger('keyboard:willShow', e);
				});
				window.addEventListener('keyboardWillHide', (e) => {
					context.pubsub.trigger('keyboard:willHide', e);
				});

			}

			// In app browser
			if (window.cordova && window.cordova.InAppBrowser && window.cordova.InAppBrowser.open)
				window.open = window.cordova.InAppBrowser.open;

			return next();
		});

		// After boot
		this.onAfterBoot(context, page);

		// Performance: finish boot
		page.use((context, next) => {
			Performance.measure('BOOT');
			return next();
		});

		// App ready
		this.onReady(context, page);

		// Start the app
		page.start();
	}

	onBeforeBoot(context, page) {}
	onInstallLibraries(context, page) {}
	onAfterBoot(context, page) {}
	onReady(context, page) {}
	onPause(context) {}
	onResume(context) {}

	navigate(url, options) {
		return (context, next) => {
			context.page.navigate(url, options);
		}
	}

	getPage(){
		return this.page;
	}

	isReady(){
		return this.page.initialized;
	}

	/**
	 * Retrive the version of app
	 * @version public
	 * @version 1.0.0
	 * @return {String} - Version string
	 */
	getVersion(){
		return this.info.version;
	}

	/**
	 * Retrive the build version of app
	 * @version public
	 * @version 1.0.0
	 * @return {String} - Build version string
	 */
	getBuildVersion(){
		return this.info.build;
	}

	/**
	 * Retrive the manufator
	 * @version public
	 * @version 1.0.0
	 * @return {String}
	 */
	getManufator(){
		return this.info.manufator;
	}

	/**
	 * Retrive the description
	 * @version public
	 * @version 1.0.0
	 * @return {String}
	 */
	getDescription(){
		return this.info.description;
	}

	/**
	 * Retrive identifier
	 * @version public
	 * @version 1.0.0
	 * @return {String}
	 */
	getIdentifier(){
		return this.info.identifier;
	}

	/**
	 * Middleware che misura le performace di un task
	 * @version 1.0.0
	 * @public
	 * @param {Object} context - Contesto globale dell'applicazione
	 * @param {Function} next - Fa proseguire la middleware a quella succesiva
	 */
	measurePerformanceMiddleware(taskName) {
		return (context, next) => {
			Performance.measure(taskName);
			return next();
		};
	}

}
