var _        = require('underscore');
var Backbone = require('backbone');

var AppView = module.exports = Backbone.View.extend({

	touchThreshold: 5,

	className: function className() {
		return 'view ' + (this.addClass || '');
	},

	initialize: function initialize(options) {
		if (typeof options !== 'undefined') {
			if ('context' in options)
				this.setContext(options.context);
			// Deprecated
			else if ('shared' in options) {
				console.warn('Deprecated: use context option instead shared');
				this.setContext(options.shared);
			}
		}

		if (this.getContext() === null)
			this.setContext(require('context'));

		// Assegno il nome della classe per quando l'elemento è attivo
		this.touchActiveClassName = 'active-state';

		// Inizializzo l'oggetto che conterrà tutte le subview
		this.views = {};
		this.cache = {};
		if (!this.options)
			this.options = {};

		// Va aggiornato, vedi FreeDUCk
		// var pubsub = this.getContext().pubsub;
		// if (pubsub)
		// 	this.listenTo(this.getContext().pubsub, 'change:locale', this.render);
	},

	// Context
	context: null,
	getContext: function getContext() {
		return this.context;
	},
	setContext: function setContext(newContext) {
		this.context = newContext;
	},

	// Deprecated
	getShared: function getShared() { return this.getContext(); },
	setShared: function setShared(newContext) { return this.setContext(newContext); },

	// Estende la view base di backbone per implementare il destroy delle view
	// refer: http://lostechies.com/derickbailey/2011/09/15/zombies-run-managing-page-transitions-in-backbone-apps/
	destroy: function destroy() {
		this.remove();
		this.off();
		if (this.onDestroy)
			this.onDestroy();
	},

	// Helper che setta lo zIndex di una view
	setZindex: function setZindex(zIndex) {
		this._zIndex = zIndex;
		this.$el.css("z-index", zIndex);
		return this;
	},
	getZindex: function getZindex() {
		return this._zIndex;
	},

	// Eventi
	addEvents: function addEvents(events) {
		this.events = _.defaults(events, this.events || {});
		return this;
	},

	// Cambio animazione css
	// Events: oanimationend animationend webkitAnimationEnd
	changeAnimation: function changeAnimation( animationName, selector) {
		var el;
		if ( _.isUndefined(selector) || selector.length == 0 ){
			el = this.$el;
		}else{
			el = selector;
		}
		el.css("animation-name", animationName);
		el.css("-webkit-animation-name", animationName);
		el.css("-moz-animation-name", animationName);
		el.css("-o-animation-name", animationName);
		return this;
	},

	// Comportamento di default in caso di errore della view.
	// Riporta in alto l'errore in modo che la view padre sappia cosa fare.
	onError: function onError(err) {
		this.throwError(err);
	},

	throwError: function throwError(err) {
		this.trigger('error', err);
	},

	findPlaceholder: function findPlaceholder(name) {
		return this.$el.find('[data-placeholder="' + name + '"]');
	},

	appendAndRenderToPlaceholder: function appendAndRenderToPlaceholder(name, view) {
		this.findPlaceholder(name).append(view.el);
		view.render();
		return this;
	},

	// Propaga il comando destroy a tutte le subview
	onDestroy: function onDestroy() {
		_.forEach(this.views, function (aView) {
			if (aView instanceof AppView)
				aView.destroy();
		});
	},

	// Metodo alternativo per associare le subview
	// http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
	assign: function (view, selector) {
		view.setElement(this.$(selector)).render();
	}

});

