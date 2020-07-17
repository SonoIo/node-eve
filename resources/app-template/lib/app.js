import _ from 'underscore';

// Globals
global.env = _.extend({}, require('../config.json'));
global.env.APP_ENV = global.env.env;


// Utils
import Backbone from 'backbone';
import {
	l,
	Application,
	BackButton,
	Dialogs
} from './utils';

// Controllers
import PagesController from './controllers/PagesController';

// Collections
import ComponentsController from './controllers/ComponentsController';

// Views
import TabView from './views/components/TabView';
import {
	PageView
} from 'backbone.uikit';

// Middlewares
import * as middlewares from './middlewares';

class App extends Application {

	//
	// Events
	//

	onBeforeBoot(context, page) {
		// Override AJAX function
		// Backbone.ajax = myAjax;
	}

	onInstallLibraries(context, page) {
		// Add external library
		page.use(middlewares.countryDetector());
		page.use(middlewares.languageDetector());
		page.use(Dialogs.middleware());
		page.use(BackButton.middleware());
	}

	onAfterBoot(context, page) {
		// Global settings
		page.use((context, next) => {
			// UI kit global configuration
			context.uikit = {
				PageView: {
					pageAnimation: context.device.isAndroid() || context.device.isBrowser() ? PageView.ANIMATION_FADE_UP : PageView.ANIMATION_PUSH_LEFT,
					duration: context.device.isAndroid() || context.device.isBrowser() ? 200 : 300
				}
			};
			return next();
		});

		// Global events
		page.use((context, next) => {

			// Authentication events
			// context.auth.on('fetched', user =>              context.pubsub.trigger('auth:fetched', user));
			// context.auth.on('login',   (user, authToken) => context.pubsub.trigger('auth:login', user, authToken));
			// context.auth.on('logout',  user =>              context.pubsub.trigger('auth:logout', user));
			// context.auth.on('refresh', token =>             context.pubsub.trigger('auth:refresh', token));

			// User login/logout
			context.pubsub.on('auth:login',  _.bind(this.onLogin, this));
			context.pubsub.on('auth:logout', _.bind(this.onLogout, this));

			// Analytics
			// context.pubsub.on('analytics', (event, screenName, params) => {
			// 	context.firebaseAnalytics.track(event, screenName, params);
			// });

			return next();
		});

		// Pages
		page.use(ComponentsController.initializeStaticViewMiddleware);
		page.use(this.tabsMiddleware);
		page.use(this.initStackMiddleware);
	}

	onReady(context, page) {

		// Called at every route
		page.url('*', 
			this.checkForRedirectMiddleware
		);

		// First route
		page.url('', this.navigate('home', { trigger: true }));

		page.url('home',
			this.clearTab('home'),
			this.navigateTab('home'),
			this.removeBootPlaceholder()
		);

	}

	/**
	 * On user login
	 * @version 1.0.0
	 * @private
	 * @param {User} user - User's model
	 */
	onLogin(user) {
		// Analytics
		// context.firebaseAnalytics.trackLogin(user);

		// Push notification
		// context.pushNotification.sendTags('email', getCustomerEmail(true));
	}

	/**
	 * On use logout
	 * @version 1.0.0
	 * @private
	 * @param {User} user - User's model
	 */
	onLogout(user) {
		// Analytics
		// context.firebaseAnalytics.trackLogout();

		// Push notification
		// context.pushNotification.deleteTags('email');
	}

	//
	// Utilities
	//

	/**
	 * Remove the boot placeholder
	 * @version 1.0.0
	 * @public
	 * @return {Function} - Middleware
	 */
	removeBootPlaceholder(){
		return (context, next) => {
			window.removeBootPlaceholder();
			return next();
		}
	}

	/**
	 * Initialize the viewstack so it can be cleared safely
	 * @version 1.0.0
	 * @public
	 * @return {Function} - Middleware
	 */
	initStackMiddleware(context, next) {
		context.viewstack.initStack();
		return next();
	}

	/**
	 * Redirect forzato all'avvio dell'app
	 * @version 1.0.0
	 * @public
	 * @return {Function} - Middleware
	 */
	checkForRedirectMiddleware(context, next) {
		let forceRedirect = context.cache.get('forceRedirect');
		if (forceRedirect) {
			context.cache.set('forceRedirect', null);
			setTimeout(() => {
				context.page.navigate(forceRedirect, { trigger: true });
			});
			return;
		}
		context.cache.set('initialized', true);
		return next();
	}

	//
	// Tabs
	//

	/**
	 * Initialize the tab bar
	 * @version 1.0.0
	 * @public
	 * @param {Object} context - Global context
	 * @param {Function} next - Execute the next middleware
	 */
	tabsMiddleware(context, next) {
		if (context.tabs) return next();
		let tabView = context.tabs = new TabView({
			navigation: false,
			tabs: [
				{
					route: 'home',
					action: PagesController.openHomeMiddleware,
					label: l('TAB_BAR->HOME'),
					icon: 'icon-homepage',
					masterDetail: false,
					visible: true,
					analyticName: 'homepage'
				},
				// {
				// 	route: 'cart',
				// 	action: PagesController.openHomeMiddleware,
				// 	label: l('TAB_BAR->CART'),
				// 	icon: 'icon-shop',
				// 	badge: 10,
				// 	masterDetail: false,
				// 	visible: true,
				// 	analyticName: 'cart'
				// }
			]
		});
		context.viewstack.pushView(tabView, { animated: false });
		return next();
	}

	/**
	 * Clear tab's viewstack
	 * @version 1.0.0
	 * @public
	 * @param {String} tab - Tab name
	 * @return {Function} - Middleware
	 */
	clearTab(tab) {
		return (context, next) => {
			context.tabs.clear(tab);
			return next();
		};
	}

	/**
	 * Navigate to the specified tab
	 * @version 1.0.0
	 * @public
	 * @param {String} tab - Tab name
	 * @param {Object} options - Option object
	 * @param {Boolean} [options.clear] - Default false. If true removes viewstack views
	 * @param {Boolean} [options.changeStatus] - Default false. If true triggers the chageStatus method
	 * @return {Function} - Middleware
	 */
	navigateTab(tab, options) {
		return (context, next) => {
			context.tabs.navigate(tab, options);
			return next();
		};
	}

	/**
	 * Navigate to the specified tab or uses the current tab if one is present
	 * @version 1.0.0
	 * @public
	 * @param {String} tab - Tab name
	 * @param {Object} options - Option object
	 * @param {Boolean} [options.clear] - Default false. If true removes viewstack views
	 * @param {Boolean} [options.changeStatus] - Default false. If true triggers the chageStatus method
	 * @return {Function} - Middleware
	 */
	navigateTabWhenNeeded(tab, options) {
		return (context, next) => {
			if (!context.tabs.getActiveState()) {
				context.tabs.navigate(tab, options);
			}
			return next();
		};
	}

}

let app = new App();

/**
 * Gestito da universal link, lasciare questo metodo per evitare un errore in console
 * @version 1.0.0
 * @param  {String} url
 */
let lastOpenedUrl;
window.handleOpenURL = function handleOpenURL(url) {
	url = _s.trim(url.toString());

	let path;
	let originalUrl = url;

	const execute = () => {
		if (context.cache.get('initialized')) {
			context.page.navigate(url, { trigger: true });
		} else {
			context.cache.set('forceRedirect', url);
		}
	};

	// Block reopening the same link for 5 seconds. 
	// It prevents an issue on iOS that could trigger multiple events
	// if the user put the app in background and foreground after
	// a deeplink/universal link navigation
	if (lastOpenedUrl == url) return;
	lastOpenedUrl = url;
	setTimeout(() => {
		lastOpenedUrl = null;
	}, 5000);

	setTimeout(() => {

		// Deeplink detection
		if (url.indexOf(global.env.DEEPLINK + '://') == 0) {
			url = url.replace(global.env.DEEPLINK + '://', '');
			return execute();
		}

		// Universal link
		if (url.indexOf('http') == 0) {
			// AdWords campaigns detect
			let u = URI(url);
			let data = u.search(true);
			let analyticsCampaign = {};
			let otherParams = {};
			_(data).each((value, key) => {
				if (_.isString(key) && key.indexOf('itm_') == 0) {
					analyticsCampaign[key] = value;
				} else {
					otherParams[key] = value;
				}
			});
			u.search(otherParams);
			url = u.toString();

			// 
			let host = `${u.protocol()}://${u.hostname()}`;
			path = _s.ltrim(_s.rtrim(url.replace(host, ''), '/'), '/');
			url = path;
			url = url.replace('/#', '');

			context.cache.set('analyticsCustomCampaign', analyticsCampaign);

			execute();
		}
	}, 1000);
}