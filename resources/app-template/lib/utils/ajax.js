
var $ = require('jquery');
var _ = require('underscore');
var __ = require('translate');

var ajax = module.exports = function ajax(url, data, done) {
	if (typeof data === 'function') {
		done = data;
		data = undefined;
	}

	if (!url)
		throw new Error('Url not defined for ajax request');

	var method = 'GET';

	if (data)
		method = 'POST';

	var options = {
		dataType: 'json',
		type: method,
		data: data
	};

	$.ajax(url, options)
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
				err = new Error(__n('errors', 'Internet disconnected'));
			else
				err = new Error(__n('errors', 'Unknonwn error'));
			done(err);
		});
};

ajax.setup = function setup() {
	$.ajaxSetup.apply($, arguments);
};

