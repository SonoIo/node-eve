var _ = require('underscore');

var InvalidError = module.exports = function InvalidError(options) {
	_.defaults(this, options, {
		field: '',
		message: ''
	});
};