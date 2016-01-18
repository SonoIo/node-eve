
var _ = require('underscore');

// Console per i vecchi browser
if (typeof console === 'undefined') {
	var f = function () {};
	window.console = {
		log:f, info:f, warn:f, debug:f, error:f
	};
}

var defaultTransport = {
	log: function() {
		console.log.apply(console, arguments);
	},
	warn: function() {
		console.warn.apply(console, arguments);
	},
	info: function() {
		console.info.apply(console, arguments);
	},
	error: function() {
		console.error.apply(console, arguments);
	}
};

var Logger = module.exports = function(options) {
	this.transports = [];

	if (!options)
		options = {};

	if (!('defaultTransport' in options) || options.defaultTransport)
		this.addTransport(defaultTransport);
};

Logger.defaultTransport = defaultTransport;

Logger.prototype.addTransport = function(transport) {
	if (typeof transport.log !== 'function'
		|| typeof transport.warn !== 'function'
		|| typeof transport.info !== 'function'
		|| typeof transport.error !== 'function')
		throw new Error('A transport have to contains log, warn, info and error function');
	
	this.transports.push(transport);
	return this;
}

Logger.prototype._log = function(type, args) {
	var aTransport;
	for (var i = this.transports.length - 1; i >= 0; i--) {
		aTransport = this.transports[i];
		aTransport[type].apply(this, args);
	}
	return this;
};

Logger.prototype.log   = function() { return this._log('log', arguments); };
Logger.prototype.warn  = function() { return this._log('warn', arguments); };
Logger.prototype.info  = function() { return this._log('info', arguments); };
Logger.prototype.error = function() { return this._log('error', arguments); };

Logger.prototype.helper = function() {
	var self = this;
	var helper = function (msg) {
		if (msg) {
			self.log(msg);
		}
		return self;
	};
	helper.log   = _.bind(self.log, self);
	helper.warn  = _.bind(self.warn, self);
	helper.info  = _.bind(self.info, self);
	helper.error = _.bind(self.error, self);
	return helper;
};


