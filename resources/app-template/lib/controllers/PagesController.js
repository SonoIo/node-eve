import _ from 'underscore';
import context from 'context-utils';

const NOOP = () => {};

export default class PagesController {

	/**
	 * Display home page using a no blocking middleware
	 * @version 1.0.0
	 * @param {Context} context 
	 * @param {Function} next 
	 */
	static openHomeMiddleware(context, options, next) {
		PagesController.openHome(options);
		return next();
	}

	/**
	 * Display the home page
	 * @version 1.0.0
	 * @param {Object} options 
	 * @param {State} [options.state] Default active tab state
	 * @param {Boolean} [options.swipeBack] Default false
	 * @param {Boolean} [options.animate] Default false
	 */
	static openHome(options) {
		options = _.defaults(options, {
			state: context.tabs.getActiveState(),
			swipeBack: false,
			animated: false
		});

		const { state } = options;
		const viewstack = state.get('viewstack');

		const HomePage = require('../views/pages/HomePage').default;
		const homeView = new HomePage(options);
		viewstack.pushView(homeView, { animated: false });
	}

	/**
	 * Display a native dialog
	 * @version 1.0.0
	 * @param {Object} options
	 * @param {Function} 
	 */
	static showAlert(options, done = NOOP) {
		context.dialogs.alert(options, done);
	}

}
