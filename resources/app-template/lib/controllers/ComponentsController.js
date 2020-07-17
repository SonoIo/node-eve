import context from "context-utils";

export default class ComponentsController {

	/**
	 * Initialize static views
	 * @version 1.0.0
	 * @public
	 * @param {Object} context
	 * @param {Function} next
	 */
	static initializeStaticViewMiddleware(context, next) {

		const { state } = context;

		// Initialize the loading Screen
		if (!context.loadingScreen){
			const LoadingScreenView = require('../views/components/LoadingScreenView').default;
			context.loadingScreen = new LoadingScreenView({
				template:        require('../../templates/components/loading_screen.html'),
				templateSuccess: '<i class="icon-check"></i>',
				templateError:   '<i class="icon-delete"></i>'
			});
			context.viewstack.pushView(context.loadingScreen);
		}

		// Initialize the notification center
		if (!context.notificationCenter) {
			const NotificationCenterView = require('../views/notifications/NotificationCenterView').default;
			context.notificationCenter = new NotificationCenterView();
			context.viewstack.pushView(context.notificationCenter);
		}

		return next();
	}
}
