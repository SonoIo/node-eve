var _       = require('underscore');
var fs      = require('fs');
var AppView = require('./AppView');

var PageView = module.exports = AppView.extend({

	className: 'page',

	initialize: function initialize(options) {
		PageView.__super__.initialize.call(this, options);
		this.options = _.defaults(this.options || {}, options, {
			modal: false
		});
	},

	render: function render() {
		PageView.__super__.render.call(this);
		if (this.options.modal) {
			this.$el.addClass('page-modal');
		}
		return this;
	},

	onDeactivate: function onDeactivate() {
		this.$el.addClass('deactivate');
	},

	onActivate: function onActivate(firstTime) {
		this.$el.removeClass('deactivate');
	}

});
