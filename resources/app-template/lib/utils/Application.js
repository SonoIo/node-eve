import _ from 'underscore';
import $ from 'jquery';
import Backbone from 'backbone';
import BackboneTouch from 'backbone.touch';
import context from 'context-utils';
import Device from 'device-utils';
import Cache from 'cache-utils';
import Settings from 'settings-utils';
import Search from 'search-utils';
import Page from 'page-utils';
import Network from 'network-utils';
import PubSub from 'backbone.pubsub';
import Viewstack from 'backbone.viewstack';
import Performance from "./Performance";
import {l} from "./index";

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
			defaultLanguage: 'en',
			lockAndroidOrientation: true,
			pushState: false
		});

		// App info will be sotred here
		this.info = {};

		this.page = new Page();
		this.boot();
	}

	boot() {
		Performance.measure('boot');
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

		// Dev mode
		if (global.env.env === 'development') {
			window._ctx = context;
			window._$   = $;
		}


		// Context vars
		context.collections = {};
		context.models = {};

		// Before boot
		this.onBeforeBoot(context, page);

		// Middlewares
		page.use(Device.middleware());
		page.use(Cache.middleware());
		page.use(PubSub.middleware());
		page.use(Settings.middleware());
		page.use(Network.middleware({ backbone: Backbone }));
		page.use(Viewstack.middleware({ el: this.options.applicationElement }));

		// Install libraries
		this.onInstallLibraries(context, page);

		// Plugins
		page.use((context, next) => {
			this.info = {
				manufator: config['author'],
				description: config['description'],
				identifier: '',
				version: '',
				build: ''
			};

			if (!window.navigator.appInfo || !window.navigator.appInfo.getAppInfo)
				return next();

			window.navigator.appInfo.getAppInfo((appInfo) => {
				context.app.identifier = appInfo.identifier;
				context.app.version    = appInfo.version;
				context.app.build      = appInfo.build;
				// Normalize build version
				let build = context.app.build.toString();
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

					context.app.build = newBuild;
				} else if ( context.device.isAndroid() ){
					context.app.build = build.substr(0, build.length - 1 ) + "/" + build[build.length-1];
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
				context.pubsub.trigger('resume');
			}, false);
			document.addEventListener('pause', () => {
				context.pubsub.trigger('pause');
			}, false);

			// Keyboard
			if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
				window.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
				window.cordova.plugins.Keyboard.disableScroll(true);
				context.keyboard = {
					active: false
				};
				window.addEventListener('native.keyboardshow', (e) => {
					context.keyboard.active = true;
					context.pubsub.trigger('keyboard:show', e);
				});
				window.addEventListener('native.keyboardhide', (e) => {
					context.keyboard.active = false;
					context.pubsub.trigger('keyboard:hide', e);
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
		page.use((context, next)=>{
			Performance.measure('boot');
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

	navigate(url, options) {
		return (context, next) => {
			context.page.navigate(url, options);
		}
	}

}
