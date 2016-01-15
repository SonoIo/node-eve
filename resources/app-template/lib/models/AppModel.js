var _ = require('underscore');
var Backbone = require('backbone');
var context = require('context');


var AppModel = module.exports = Backbone.Model.extend({
	idAttribute: 'id',
	serverUrl: env.SERVER_URL,
	database: env.DATABASE,
	rejectedPaths: null,

	initialize: function initialize() {
		AppModel.__super__.initialize.apply(this, arguments);
		// this.listenToRefs();
		this._fetching = false;
	},

	toString: function toString() {
		return this.id;
	},

	toSearchString: function toSearchString() {
		return this.id;
	},

	listenToRefs: function listenToRefs() {
		var self = this;
		self.stopListeningToRefs();
		// Verifica l'esistenza di relazioni tra questo model
		// e le sue referenze. Nel caso una referenza non esista
		// inizializza il model con il solo attributo id valorizzato
		// e si mette in ascolto per propagare l'evento change 
		// dei model in relazione.
		if (self.belongsTo) {
			var aRef;
			var aRefModel;
			var aForeignKey;
			_.each(self.belongsTo, function (aBelongsTo) {
				aRef = self.getRef(aBelongsTo.ref);
				aForeignKey = self.attributes[aBelongsTo.foreignKey];
				if (!aForeignKey) return;
				aRefModel = aRef.get(aForeignKey);
				// Se non esiste il model lo istanzio creandone uno vuoto ma
				// con l'ID. Anche in caso di fetch il model riceverà un update
				// e l'evento change verrà scatenato.
				if (!aRefModel) {
					aRefModel = new aRef.model();
					aRefModel.set(aRefModel.idAttribute, aForeignKey);
					aRef.add(aRefModel);
				}
				// Si mette in ascolto e propaga due eventi:
				// -> change
				// -> change:[aBelongsTo.ref]
				self.listenTo(aRefModel, 'change', function (model, options) {
					self.onRefChange(model, aBelongsTo, options);
				});
			});
		}
	},

	stopListeningToRefs: function stopListeningToRefs() {
		// ISSUE: se per qualche motivo il model sta in ascolto su un evento change
		//        importante qui viene fermato.
		this.stopListening(null, 'change');
	},

	getRef: function getRef(name) {
		name = name.toLowerCase();
		if (!context.collections)
			// throw new Error('Cannot retrieve ref without a collection');
			return null;
		if (!context.collections[name])
			// throw new Error('No ref named "' + name + '" for this model');
			return null;
		return context.collections[name];
	},

	getRefModel: function getRefModel(name, id) {
		var ref = this.getRef(name);
		if (!ref) return null;
		var refModel = ref.get(id);
		if (!refModel) return null;
		return refModel;
	},

	getStringOfRefModel: function getStringOfRefModel(ref, id) {
		var refModel = this.getRefModel(ref, id);
		if (refModel)
			return refModel.toString();
		return '';
	},

	onRefChange: function onRefChange(refModel, belongsTo, options) {
		if (typeof options === 'undefined')
			options = {};
		options.ref = refModel;
		this.trigger('change:' + belongsTo.foreignKey, this, options);
		this.trigger('change', this, options);
	},

	hasRejectedPaths: function hasRejectedPaths() {
		return this.rejectedPaths !== null && this.rejectedPaths.length > 0;
	},

	getRejectedPaths: function getRejectedPaths() {
		return this.rejectedPaths;
	},

	setRejectedPaths: function setRejectedPaths(rejectedPaths) {
		this.rejectedPaths = rejectedPaths;
	},

	getRejectedValues: function getRejectedValues() {
		var self = this;
		var paths = this.getRejectedPaths();
		if (paths === null || paths === void 0 || paths.length === 0) return null;
		var result = {};
		_.forEach(paths, function (aPath) {
			result[aPath] = {
				current:  self.get(aPath),
				previous: self.previous(aPath)
			}
		});
		return result;
	},

	fetch: function fetch(options) {
		options = options ? options : {};
		var success = options.success;
		var error   = options.error;
		var model   = this;
		model._fetching = true;
		options.success = function (resp) {
			model._fetching = false;
			if (success) success(model, resp, options);
		};
		options.error = function (resp) {
			model._fetching = false;
			if (error) error(model, resp, options);
		};
		return AppModel.__super__.fetch.call(this, options);
	},

	isFetching: function isFetching() {
		return !!this._fetching;
	}

});




