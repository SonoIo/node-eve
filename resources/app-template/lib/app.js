import Application from './utils/Application';

// Utils
import Backbone from 'backbone';

// Controllers
import HomeController from './controllers/HomeController';

// Collections
// import Posts from './collections/Posts';

// Views
// import TabView from './views/components/TabView';

class App extends Application {

	//
	// Events
	//

	onBeforeBoot(context, page) {
		console.log('Application: before boot');

	}

	onInstallLibraries(context, page){
		console.log("Application: install libraries");
		// Add external library
		// page.use(PayPal.middleware());
	}

	onAfterBoot(context, page) {
		console.log('Application: after boot');
		// Collections
		// context.collections.posts = new Posts();

		// Initialize new middleware. Ex. OneSignal
		// page.use((context, next)=>{
		// 	if (window.plugins && window.plugins.OneSignal) {
		// 		const iosSettings = {
		// 			kOSSettingsKeyAutoPrompt: false,
		// 			kOSSettingsKeyInAppLaunchURL: false
		// 		};
		// 		window.plugins.OneSignal.startInit(global.env.ONE_SIGNAL_APP_KEY, global.env.GOOGLE_PROJECT_NUMBER)
		// 			.iOSSettings(iosSettings)
		// 			.inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.None) // None, InAppAlert, and Notification
		// 			.handleNotificationReceived(function(jsonData) { })
		// 			.handleNotificationOpened(function(jsonData) { })
		// 			.endInit();
		// 	}
		// 	return next();
		// });

	}

	onReady(context, page) {

		// Adding all routes

		page.url('*',
			// this.tabsMiddleware,
			this.initStackMiddleware
		);

		page.url('', this.navigate('home', { trigger: true }));

		page.url('home',
			// this.clearTab('home'),
			// this.navigateTab('home'),
			HomeController.openHomeMiddleware
		);

	}

	//
	// Utilities
	//

	initStackMiddleware(context, next) {
		context.viewstack.initStack();
		return next();
	}

	//
	// Tabs
	//

	// Initialize tabs view
	// tabsMiddleware(context, next) {
	// 	if (context.tabs) return next();
	// 	let tabView = context.tabs = new TabView({
	// 		tabs: [
	// 			{ route: 'home', label: __('Home'),    masterDetail: false },
	// 			{ route: 'account', label: __('My account'), masterDetail: false }
	// 		]
	// 	});
	// 	context.viewstack.pushView(tabView);
	// 	return next();
	// }

	// Clear tab stack
	// clearTab(tab) {
	// 	return (context, next) => {
	// 		context.tabs.clear(tab);
	// 		return next();
	// 	};
	// }

	// Navigate to specific tab
	// navigateTab(tab, options) {
	// 	return (context, next) => {
	// 		context.tabs.navigate(tab, options);
	// 		return next();
	// 	};
	// }

}

let app = new App();
