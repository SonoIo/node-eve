// Utils
import _ from 'underscore';
import Backbone from 'backbone';
import {
	l,
	Application,
	GeolocationPlugin
} from './utils';



// Controllers
import PagesController from './controllers/PagesController';

// Collections
import ComponentsController from './controllers/ComponentsController';

// Views
// import TabView from './views/components/TabView';

// Middlewares
import * as middlewares from './middlewares';

class App extends Application {

	//
	// Events
	//

	onBeforeBoot(context, page) {
		// Before boot
	}

	onInstallLibraries(context, page){
		// Add external library
		page.use(middlewares.countryDetector());
		page.use(middlewares.languageDetector());
		page.use(GeolocationPlugin.middleware());
		// Registro i metodi per la geolocaizzazione
		page.use((context, next) => {
			// Prompt native geolocation
			context.geolocation.register(GeolocationPlugin.METHOD_TYPE_PROMPT_NATIVE_REQUEST, (err, granted) => {
				if (err || !granted) {
					context.geolocation.disable();
					return;
				}
				context.geolocation.enable();
			});

			// Check if the user permission is changed since the last boot
			context.geolocation.register(GeolocationPlugin.METHOD_TYPE_CHECK_STATUS, (err, granted) => {
				if (!err && _.isObject(granted)) {
					if (granted.enabled && granted.available && granted.authorized) {
						context.geolocation.enable();
					} else {
						context.geolocation.disable();
					}
				}
			});

			return next();
		});
	}

	onAfterBoot(context, page) {
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
	}

	onReady(context, page) {

		// Adding all routes
		page.url('*',
			ComponentsController.initializeStaticViewMiddleware,
			// this.tabsMiddleware,
			this.initStackMiddleware,
			// Add fetch middlewares here
		);

		page.url('', this.navigate('home', { trigger: true }));

		page.url('home',
			// this.clearTab('home'),
			// this.navigateTab('home'),
			PagesController.openHomeMiddleware,
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
		// context.pushNotification.sendTags("email", getCustomerEmail(true) );
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
		// context.pushNotification.deleteTags("email");
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
	// tabsMiddleware(context, next) {
	// 	if (context.tabs) return next();
	// 	let tabView = context.tabs = new TabView({
	// 		navigation: false,
	// 		tabs: [
	// 			{
	// 				route:        'home',
	// 				action:       PagesController.openHomeMiddleware,
	// 				label:        l('TAB_BAR->HOME'),
	// 				icon:         'icon-home',
	// 				masterDetail: false,
	// 				visible:      true,
	// 				analyticName: 'homepage'
	// 			},
	// 			{
	// 				route:        'cart',
	// 				action:       PagesController.openHomeMiddleware,
	// 				label:        l('TAB_BAR->CART'),
	// 				icon:         'icon-cart',
	// 				badge:        10,
	// 				masterDetail: false,
	// 				visible:      true,
	// 				analyticName: 'cart'
	// 			}
	// 		]
	// 	});
	// 	context.viewstack.pushView(tabView, { animated: false });
	// 	return next();
	// }

	/**
	 * Clear tab's viewstack
	 * @version 1.0.0
	 * @public
	 * @param {String} tab - Tab name
	 * @return {Function} - Middleware
	 */
	// clearTab(tab) {
	// 	return (context, next) => {
	// 		context.tabs.clear(tab);
	// 		return next();
	// 	};
	// }

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
	// navigateTab(tab, options) {
	// 	return (context, next) => {
	// 		context.tabs.navigate(tab, options);
	// 		return next();
	// 	};
	// }

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
	// navigateTabWhenRequired(tab, options) {
	// 	return (context, next) => {
	// 		if (!context.tabs.getActiveState()) {
	// 			context.tabs.navigate(tab, options);
	// 		}
	// 		return next();
	// 	};
	// }

}

let app = new App();
