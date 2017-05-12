import _ from "underscore";
import { Model } from "backbone";

export default class AppModel extends Model {

	constructor(attrs, options) {
		super(attrs, options);
		this.fetching = false;
	}

	toString() {
		return this.id;
	}

	toSearchString() {
		return this.id;
	}

	fetch(options) {
		options = options ? options : {};
		var success = options.success;
		var error   = options.error;
		var model   = this;
		model.fetching = true;
		options.success = function (model, resp, options) {
			model.fetching = false;
			if (success) success(model, resp, options);
		};
		options.error = function (model, resp, options) {
			model.fetching = false;
			if (error) error(model, resp, options);
		};
		super.fetch(options);
	}

	isFetching() {
		return !!this.fetching;
	}


}

AppModel.prototype.id = 'id';
