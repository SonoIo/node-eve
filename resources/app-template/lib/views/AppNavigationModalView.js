import _ from "underscore";
import $ from "jquery";
import context from "context-utils";
import { NavigationModalView } from "backbone.uikit";

/**
 * Extend this class to show a modal view with a viewstack
 */
export default class AppNavigationModalView extends NavigationModalView {

	/**
	 * Show and wait for completion of the modal.
	 * It calls a done callback and return a promise.
	 * Possible states are: 'success', 'cancel', 'error'. 
	 * Use the same name for triggers inside the modal.
	 * @version 1.0.0
	 * @param {Object} options 
	 * @param {Function} done 
	 * @return {Promise}
	 */
	static show(options, done = NOOP) {
		if (typeof options == 'function') {
			done = options;
			options = {};
		}
		done = _.once(done);
		options = _.defaults(options, {
			state: context.state
		});
		const state = options.state;
		const viewstack = state.get('viewstack');
		const modal = new this(options);
		const completionHandler = new Promise((resolve, reject) => {
			modal.once('success', (data) => {
				done(null, data);
				resolve(data);
			});
			modal.once('cancel', () => {
				done();
				resolve();
			});
			modal.once('error', (err) => {
				done(err);
				reject(err);
			});
		});
		viewstack.pushView(modal, { animated: true });
		return completionHandler;
	}

	constructor(options) {
		options = _.defaults(options, {
			navigationViewClass: null
		});
		super(options);
	}

}
