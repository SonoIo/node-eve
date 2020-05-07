import _ from "underscore";
import $ from "jquery";
import context from "context-utils";
import { PageView, IosBarView,  } from "backbone.uikit";
import {l} from "../../utils/index";

export default class HomePage extends PageView {

	addClass() {
		return 'home-page';
	}

	constructor(options) {
		super(options);

		// this.template = require('../../../templates/home/home.html');

		let state = this.getState();
		let navigationBarView = new IosBarView({
			state: state,
			addClass: 'back-bar',
			left: '<i class="icon-close js-close"></i>',
			center: $('<span class="title"></span>').text(l('HOME_PAGE->TITLE')),
			popViewOnBackButton: false
		});
		this.addSubView('navigationBarView', navigationBarView);

		this.listenTo(navigationBarView, 'leftClick', this.onNavigationBarLeftSideClick);
	}

	getNavigationBar() {
		return this.getSubView('navigationBarView');
	}

	getAnimationPushDuration() {
		return 0;
	}

	onRender(rendered) {
		if (!rendered) {
			// this.$el.html(template({ model: this.model.toJSON() }));
		}
		if (this.model) {
			// Filled
		}
		else {
			// Empty
		}
	}

	onNavigationBarLeftSideClick(e) {
		this.trigger('close', e);
	}

	onBeforeActivate() {
		super.onBeforeActivate();
	}

	onActivate(firstTime) {
		super.onActivate(firstTime);
	}

	onBeforeDeactivate() {
		super.onBeforeDeactivate();
	}

	onDeactivate() {
		super.onDeactivate();
	}

}
