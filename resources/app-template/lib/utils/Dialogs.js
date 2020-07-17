import _ from "underscore";
import { lockCurrentOrientation, unlockOrientation } from "./index";

export default class Dialogs {

	static middleware(options) {
		return function (context, next) {
			context.dialogs = Dialogs;
			return next();
		};
	}

	static alert(message, alertCallback, title, buttonName) {
		if (_.isObject(message)) {
			title      = message.title;
			buttonName = message.buttonName;
			message    = message.message;
		}

		if (typeof navigator.notification === 'undefined' || typeof navigator.notification.alert === 'undefined') {
			alert(message);
			return alertCallback();
		}
		let callback = () => {
			unlockOrientation(() => alertCallback());
		}

		lockCurrentOrientation(() => {
			navigator.notification.alert(message, callback, title, buttonName);
		});
	}

	static confirm(message, confirmCallback, title, buttonLabels) {
		if (_.isObject(message)) {
			title        = message.title;
			buttonLabels = message.buttonLabels;
			message      = message.message;
		}

		if (typeof navigator.notification === 'undefined' || typeof navigator.notification.confirm === 'undefined') {
			var response = confirm(message);
			return confirmCallback(response ? 2 : 1);
		}
		let callback = (response) => {
			unlockOrientation(() => confirmCallback(response));
		}

		lockCurrentOrientation(() => {
			navigator.notification.confirm(message, callback, title, buttonLabels);
		});
	}

	static prompt(message, promptCallback, title, buttonLabels, defaultText) {
		if (_.isObject(message)) {
			title        = message.title;
			buttonLabels = message.buttonLabels;
			defaultText  = message.defaultText;
			message      = message.message;
		}

		if (typeof navigator.notification === 'undefined' || typeof navigator.notification.prompt === 'undefined') {
			var response = prompt(message, defaultText);
			return promptCallback(response != null ? 2 : 1, response); // buttonIndex, input1
		}
		let callback = (response) => {
			unlockOrientation(() => promptCallback(response));
		}

		lockCurrentOrientation(() => {
			navigator.notification.prompt(message, callback, title, buttonLabels, defaultText);
		});
	}

}
