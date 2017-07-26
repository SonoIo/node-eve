var async    = require('async');
var _        = require('underscore');
var Backbone = require('backbone');


var AppCollection = module.exports = Backbone.Collection.extend({
	idAttribute: '_id',
	serverUrl: env.SERVER_URL,
	database: env.DATABASE,
	_comparatorType: null,
	fetching: false,

	refs: null,

	initialize: function initialize() {
		AppCollection.__super__.initialize.apply(this, arguments);
		this.previousFetchData = {};
		this.moreToLoad        = true;
	},

	// Quando un model viene aggiunto ad una collection allora aggiorna
	// le dipendenze del model in modo che sia in grado di aggiornarsi
	// anche quando le sue dipendenze cambiano
	// _addReference: function(model, options) {
	// 	AppCollection.__super__._addReference.apply(this, arguments);
	// 	model.listenToRefs();
	// },
	// _removeReference: function(model, options) {
	// 	AppCollection.__super__._removeReference.apply(this, arguments);
	// 	model.stopListeningToRefs();
	// },

	// Carica elementi dal server un po' alla volta
	loadMore: function loadMore(options, done) {
		if (!this.moreToLoad) {
			_.defer(function () {
				return done(null, false, 0);
			});
			return;
		}

		if (!options)
			options = {};
		var self      = this;
		var data      = _.defaults(options.data || {}, this.previousFetchData);
		var oldLength = this.length;
		var offset    = oldLength;

		options.limit  = options.limit || 20;
		options.offset = offset;
		options.remove = false;
		options.add    = offset > 0;
		options.reset  = offset === 0;

		data.currentPage = Math.floor(offset/options.limit) + 1;
		data.pageSize    = options.limit;

		// Indica al fetch che questa chiamata è la continuazione
		// di quella precedente
		options.loadMore = true;
		options.data = data;

		options.success = function(collection, response, opt) {
			self.fetching = false;
			if (done) {
				var moreToLoad = self.moreToLoad = collection.length - oldLength == options.limit;
				done(null, moreToLoad, collection.length - oldLength, oldLength);
			}
		};
		options.error = function(collection, response, options) {
			self.fetching = false;
			if (done) done(new Error(response));
		};

		this.fetching = true;
		this.fetch(options);
	},

	fetch: function fetch(options) {
		if (!options.loadMore) {
			this.moreToLoad = true;
			this.previousFetchData = options ? options.data || {} : {};
		}
		if (global.env.APP_DEMO && options && options.data)
			delete options.data;

		if (options && options.data && options.data.currentPage)
			options.data.currentPage--;

		AppCollection.__super__.fetch.call(this, options);
	},

	fetchAll: function fetchAll(done) {
		var self = this;
		var canFetch = true;
		self.reset();
		async.whilst(
			function () { return canFetch; },
			function (next) {
				self.loadMore({}, function (err, moreToLoad) {
					if (err) return next(err);
					canFetch = moreToLoad;
					next();
				});
			},
			function (err) {
				return done(err);
			}
		);
	}

});
