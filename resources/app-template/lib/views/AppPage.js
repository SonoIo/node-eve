import _ from 'underscore';
import $ from 'jquery';
import { View } from 'backbone';
import context from 'context-utils';
import { PageView, FormView } from 'backbone.uikit';

const TOP_DOWN = 'top-down';
const DOWN_TOP = 'down-top';

export default class AppPage extends PageView {

	constructor(options) {
		options = _.defaults(options || {}, {
			deltaPageRender: context.device.isAndroid() ? 100 : -400
		});

		super(options);
		this.setDefaultsOptions({
			autoScroll: true,
			hideTabBarOnScroll: false,
			changeDirectionPan: 30,
			changeHeaderPan: 30
		});

		this.direction = null;
		this.previousDirection = null;
		this.startChangeDirectionAt = 0;
		this.y = 0;
		this.previousY = 0;

		this.onScroll = _.bind(this.onScroll, this);

		this.cache.$content = $(`<div class="content-page" />`);
		this.cache.content = this.cache.$content.get(0);
		if (this.options.autoScroll) {
			this.cache.content.classList.add('overflow-scroll');
			this.cache.content.addEventListener('scroll', this.onScroll);
		}

		if (this.options.hideTabBarOnScroll) {
			this.el.classList.add('hide-tab-bar');
		}
	}

	//
	// Events
	//

	onRender(rendered) {
		if (!rendered) {
			const navigationBar = this.getBarView();
			if (navigationBar instanceof View) {
				this.$el.append(navigationBar.el);
				navigationBar.render();
			}
			// Creo il div wrapper per il contenuto della pagina
			this.$el.append(this.cache.$content);
		}
	}

	onScroll(e) {
		const scroller = this.cache.content;
		let y = this.y = -scroller.scrollTop;
		this.direction = y < this.previousY ? TOP_DOWN : DOWN_TOP;

		if (this.direction != this.previousDirection && y < 0) {
			this.startChangeDirectionAt = y;
			this.previousDirection = this.direction;
		}

		if (this.options.hideTabBarOnScroll) {
			if (this.startChangeDirectionAt !== null && Math.abs(this.startChangeDirectionAt - y) > this.options.changeDirectionPan) {
				this.startChangeDirectionAt = null;
				if (this.direction === TOP_DOWN) {
					context.tabs && context.tabs.hideTabBar();
				} else {
					context.tabs && context.tabs.showTabBar();
				}
			}
			if (y === 0) {
				context.tabs && context.tabs.showTabBar();
			}
		}

		const navigationBarView = this.getBarView();
		if (navigationBarView && navigationBarView.setScrolled) {
			navigationBarView.setScrolled(-y > this.options.changeHeaderPan);
		}

		this.previousY = y;
	}

	getAnimationPushDuration() {
		return 0;
	}

	onActivate(...args) {
		super.onActivate(...args);
		context.pubsub.trigger('page:activate', this);
	}

	onDestroy() {
		if (this.options.autoScroll) {
			this.el.removeEventListener('scroll', this.onScroll);
		}
		super.onDestroy();
	}

	onFormTransition(transition) {
		const navigationBarView = this.getBarView();
		if (navigationBarView && navigationBarView.setScrolled) {
			navigationBarView.setScrolled(transition);
		}
	}

	//
	// Methods
	//

	addSubView(name, view, options) {
		super.addSubView(name, view, options);
		if (view instanceof FormView) {
			this.listenTo(view, 'form:transition', this.onFormTransition);
		}
		return this;
	}

	removeSubView(name) {
		const view = this.getSubView(name);
		if (view instanceof FormView) {
			this.listenTo(view, 'form:transition', this.onFormTransition);
		}
		return super.removeSubView(name);
	}

	getContainerElement() {
		return this.cache.content;
	}

	getJQueryContainerElement() {
		return this.cache.$content;
	}

	getBarView() {
		return this.getSubView('navigationBarView');
	}

}
