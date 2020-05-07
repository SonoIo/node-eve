import _ from "underscore";
import { t } from "typy";
import { Model } from "backbone";

Model.prototype.safeGet = function(path, type) {
	let method;
	switch (type) {
		case 'string':  method = 'safeString';  break;
		case 'number':  method = 'safeNumber';  break;
		case 'boolean': method = 'safeBoolean'; break;
		case 'object':
		default:        method = 'safeObject';  break;
	}
	return t(this.attributes, path)[method];
};

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
