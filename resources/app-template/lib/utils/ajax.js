import $ from "jquery";
import _ from "underscore";
import {l} from "./index";

let ajax = function ajax(url, data, options, done) {
	if (typeof data === 'function') {
		done = data;
		data = undefined;
	}
	if ( typeof options === 'function' ){
		done    = options;
		options =  {};
	}

	if (!url)
		throw new Error('Url not defined for ajax request');

	var method = 'GET';

	if (data)
		method = 'POST';

	options = _.defaults(options||{}, {
		dataType: 'json',
		type: method,
		data: data
	});

	return $.ajax(url, options)
		.done(function (data, textStatus, jqXHR) {
			done(null, data);
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			var err;
			if (jqXHR.responseJSON)
				err = jqXHR.responseJSON;
			else if (jqXHR.responseText && jqXHR.responseText != '')
				err = new Error(jqXHR.responseText);
			else if (errorThrown && errorThrown != '')
				err = new Error(errorThrown);
			else if (jqXHR.status == 0)
				err = new Error(l('Internet disconnected'));
			else
				err = new Error(l('Unknonwn error'));
			done(err);
		});
};

ajax.setup = function setup() {
	$.ajaxSetup.apply($, arguments);
};

export default ajax;
