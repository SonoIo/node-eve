import _ from "underscore";
import context from "context-utils";

export default class PagesController {

	// Middleware
	static openHomeMiddleware(context, options, next) {
		if (typeof options == 'function') {
			next = options;
			options = {};
		}
		PagesController.openHome(options);
		return next();
	}

	// Home logic
	static openHome(options) {
		options = _.defaults(options || {}, {
			state: context.state // With tabs context.tabs.getActiveState()
		});

		const { state } = options;
		const viewstack = state.get('viewstack');

		const HomePage = require('../views/pages/HomePage').default;
		const homeView = new HomePage({
			state:     state,
			swipeBack: false,
			animated:  false
		});
		viewstack.pushView(homeView, { animated: false });
	}

}
