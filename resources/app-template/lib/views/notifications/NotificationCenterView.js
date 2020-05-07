import _ from "underscore";
import $ from "jquery";
import context from "context-utils";
import { BaseView, ImageView, style } from "backbone.uikit";
import { vibrate } from "../../utils";
import Notification from "../../models/Notification";
import NotificationView from "../../views/notifications/NotificationView";
import NotificationErrorView from "../../views/notifications/NotificationErrorView";

var uniqueMessageId = 0;
var prefix = (function () {
	var styles = window.getComputedStyle(document.documentElement, '');
	var pre    = (Array.prototype.slice
		.call(styles)
		.join('')
		.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
	)[1];
	var dom    = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
	return {
		dom: dom,
		lowercase: pre,
		css: '-' + pre + '-',
		js: pre[0].toUpperCase() + pre.substr(1)
	};
})();

// Refer: http://www.w3schools.com/jsref/event_animationend.asp
// webkitAnimationEnd: Code for Chrome, Safari and Opera
// animationend: other browser.
// Compability: >= IE10, >= 4.0 Chrome, >= 16 Moz, >= 4.0 Safari, >= 15.0 Opera
var _animationEnd = [ 'WebKit', 'O' ].indexOf(prefix.dom) > -1 ? 'webkitAnimationEnd' : 'animationend';

export default class NotificationCenterView extends BaseView {

	className() {
		return 'notification-center js-notification-center hide-bg';
	}

	constructor(options) {
		super(options);

		this.currentNotificationView = null;
		this.counter = 0;

		this.listenTo(context.pubsub, 'notify', this.parseNotifications);
		this.listenTo(context.pubsub, 'notify-hide', this.onNotificationHide);
		this.listenTo(context.pubsub, 'error',  this.parseErrors);

		window._style = style;

		this.addEvents({
			'click': 'onClick'
		});

		this.events[_animationEnd] = 'onTransitionEnd';

		this.add = _.debounce(_.bind(this.add, this), 500);
	}

	add(notification) {
		if (this.currentNotificationView) {
			this.counter--;
			this.currentNotificationView.destroy();
			this.currentNotificationView = null;
		}

		if ( this.counter == 0) {
			this.requestAnimationFrame(()=>{
				this.el.classList.remove('hide-bg');
				this.el.classList.add('show-bg');
			});
		}

		this.counter++;

		let newNotificationView = this.currentNotificationView = this.createNotificationView(notification);
		this.$el.append(newNotificationView.el);
		newNotificationView.render();


		if (notification.get('vibrate')) {
			vibrate();
		}
	}

	onRender(rendered) {
		if (!rendered) {
			this.$el.empty();
		}
	}

	parseNotifications(data, ...args) {
		if (!data) return;

		let options, argsLen = args.length;
		if (argsLen) {
			const lastArg = args[argsLen - 1];
			if ($.isPlainObject(lastArg)) {
				options = args.pop();
				argsLen--;
			}
		}

		let notification;
		if (typeof data === 'string') {
			notification = new Notification({
				title: argsLen ? data : '',
				message: argsLen ? args[0] : data
			}, { parse: true });
		} else if (('messages' in data) || ('message' in data)) {
			notification = new Notification({
				message: this.parseJSON(data)
			}, { parse: true });
		} else if (data instanceof Notification) {
			notification = data;
		}

		if (options && notification) notification.set(options);

		if (notification) this.add(notification);
	}

	parseErrors(err, ...args) {

		let options;
		let argsLen = args.length;
		if (argsLen) {
			const lastArg = args[argsLen - 1];
			if ($.isPlainObject(lastArg)) {
				options = args.pop();
				argsLen--;
			}
		}

		let message;
		// if (err === void 0)                                   return '';
		// if ('statusText' in err && err.statusText == 'abort') return null;
		// if ('field' in err && 'message' in err)               return this.parseInvalid(err);
		// if ('statusText' in err)                              return err.statusText;
		if (typeof err === 'string')         message = err;
		else if ('error_description' in err) message = err.error_description;
		else if ('errors' in err)            message = this.parseJSON(err);
		else if ('details' in err)           message = err.details;
		else if ('message' in err)           message = err.message;
		else if ('responseJSON' in err)      message = this.parseJSON(err.responseJSON);
		else if ('responseText' in err)      message = this.parseXHR(err.responseText);

		let notification = new Notification({
			title: argsLen ? message : '',
			message: argsLen ? args[0] : message,
			view: NotificationErrorView
		}, { parse: true });

		// if (options) {
		// 	notification.set(options);
		// }

		this.add(notification);

		// Analytics
		context.pubsub.trigger('analytics', 'error', { message: notification.get('message') });
	}

	parseInvalid(resp) {
		return resp.message;
	}

	parseJSON(resp) {
		if (!resp)         return 'UnknownError';
		if (resp.message)  return resp.message;
		if (resp.errors)   return resp.errors[0].message;
		if (resp.messages) return resp.messages[0].message;
		if (resp.type)     return resp.type;
		return 'UnknownError';
	}

	parseXHR(resp) {
		try {
			resp = JSON.parse(resp);
			return this.parseJSON(resp);
		}
		catch (e) {}
		return resp;
	}

	createNotificationView(notification) {
		let viewClass = notification.get('view');
		if (typeof viewClass !== 'function') {
			viewClass = NotificationView;
		}

		let newView = new viewClass({
			model: notification,
			parent: this
		});
		return newView;
	}

	onNotificationHide () {
		this.counter--;
		if ( this.counter <= 0) {
			this.counter = 0;
			this.requestAnimationFrame(()=>{
				this.el.classList.add('hide-bg');
				previousStatusBar();
			});
		}
	}

	onTransitionEnd (event) {
		if ( this.counter == 0 ) {
			if (this.currentNotificationView) this.currentNotificationView = null;
			this.requestAnimationFrame(()=>{
				this.el.classList.remove('show-bg');
			});
		}
	}

	onClick(e) {
		e.preventDefault();
		e.stopPropagation();
		if (this.currentNotificationView) {
			this.currentNotificationView.hide();
		}
	}

}
