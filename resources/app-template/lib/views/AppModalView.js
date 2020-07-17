import _ from 'underscore';
import context from 'context-utils';
import { ModalView } from 'backbone.uikit';

const NOOP = () => { };

/**
 * Extend this class to show a modal view in your app
 */
export default class AppModalView extends ModalView {

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
		options = _.defaults(options || {}, {
			translateOnKeyboard: false
		});
		// Disable buttons
		options = _.extend(options, {
			buttons: {}
		});
		super(options);

		this.cache.viewport = context.device.getViewport();
		this.cache.positionBottom = 0;

		this.addEvents({
			'click .js-close': 'onClose'
		});

		this.debounce('onClose');

		this.listenTo(context.pubsub, 'keyboard:show', this.onKeyboardShow);
		this.listenTo(context.pubsub, 'keyboard:hide', this.onKeyboardHide);
	}

	onClose(e) {
		this.trigger('cancel');
		return super.onClose(e);
	}

	onKeyboardShow(e) {
		if (!this.options.translateOnKeyboard) return;
		if (!this.cache.$container) return;

		let keyboardHeight = e.keyboardHeight;
		let bottom = this.cache.positionBottom;

		if (bottom < keyboardHeight) {
			bottom = keyboardHeight + 20;
			this.requestAnimationFrame(() => {
				this.el.classList.add('shifted');
				this.cache.$container.css({
					transform: `translateY(-${bottom}px)`
				});
			});
		}
	}

	onKeyboardHide(e) {
		if (!this.options.translateOnKeyboard) return;
		if (!this.cache.$container) return;

		if (this.cache.isClosing) return;
		this.requestAnimationFrame(() => {
			this.cache.$container.css({
				transform: `translateY(0)`
			});
		});
	}
}
