import _ from "underscore";
import $ from "jquery";
import context from "context-utils";
import { BaseView, style } from "backbone.uikit";
import { l } from "../../utils";

/**
 * View per visualizzare il loading dell'applicazione
 * @extends BaseView
 * @version 1.0.0
 * @param {Object} options
 * @param {String} [options.template] - Template pricipale della view, ad esempio il logo dell'applicazione o una GIF/SVG di animazione.
 * @param {String} [options.templateSuccess] - Template per il loading screen di successo. Viene utilizzato ad esempio dopo una conferma positiva
 * @param {String} [options.templateError] - Template per il loading screen di errore. Viene utilizzato ad esempio dopo una conferma negativa
 */
export default class LoadingScreenView extends BaseView {

	addClass(){
		return 'loading-screen';
	}

	constructor(options) {
		super(options);

		this.options = _.defaults(this.options, {
			template: null,
			templateSuccess: null,
			templateError: null
		});

		let events = {
			'touchmove': 'onTouchMove'
		};

		// Per ios 8.x
		if ( window.onwebkitanimationend ){
			events.webkitAnimationEnd = 'onAnimationEnd';
		}else{
			events.animationend = 'onAnimationEnd';
		}

		this.addEvents(events);

		this.isHiding = false;
		this.isAnimatingAlert = false;
		this.counter = 0;
	}

	onRender(rendered) {
		if (rendered) return this;

		const options    = this.options || {};
		const cache      = this.cache;

		const tpl        = options.template;
		const tplSuccess = options.templateSuccess;
		const tplError   = options.templateError;

		cache.$content         = $('<div>').addClass('content');
		cache.$template        = $(_.isFunction(tpl)        ? options.template({l})        : tpl       ).addClass('loading');
		cache.$templateSuccess = $(_.isFunction(tplSuccess) ? options.templateSuccess({l}) : tplSuccess).addClass('template-hidden');
		cache.$templateError   = $(_.isFunction(tplError)   ? options.templateError({l})   : tplError  ).addClass('template-hidden');

		cache.$content.append(cache.$template);
		cache.$content.append(cache.$templateSuccess);
		cache.$content.append(cache.$templateError);
		cache.$content.append(cache.$message);

		if (cache.$template) {
			cache.$slides = cache.$template.find('.loading-screen-slide');
			this.randomize();
		}

		this.$el.append(this.cache.$content);
	}

	randomize () {
		const $slides = this.cache.$slides;
		if (!$slides) return;
		const slidesLen = $slides.length;
		if (!slidesLen) return;
		$slides.removeClass('active');
		$slides.eq(_.random(slidesLen - 1)).addClass('active');
	}

	/**
	 * Visualizza il loading screen
	 * @version 1.0.0
	 * @public
	 * @param {Number} delay [0] - Numero intero che indica il tempo d'attesa prima di visualizzare la view
	 * @return {LoadingScreen}
	 */
	show(delay) {
		this.counter++;
		if (this.counter > 1) return;
		if (!_.isNumber(delay)) delay = 0;
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		// if (this.timeoutHide)
		// 	clearTimeout(this.timeoutHide);
		this.timeout = setTimeout(() => {
			this.requestAnimationFrame(()=>{
				this.timeout = null;
				this.$el.removeClass('hide');
				this.$el.addClass('show');
				this.displayed = true;
			});
		}, (200+delay) );

		return this;
	}

	/**
	 * Cambia l'aspetto della view in Success
	 * @version 1.0.0
	 * @public
	 * @return {LoadingScreen}
	 */
	success() {
		this.requestAnimationFrame(()=>{
			this.cache.$template.addClass('template-hidden');
			this.cache.$templateSuccess.removeClass('template-hidden');
			this.cache.$templateSuccess.addClass('success');
			this.isAnimatingAlert = true;
		});
		return this;
	}

	/**
	 * Cambia l'aspetto della view in Error
	 * @version 1.0.0
	 * @public
	 * @return {LoadingScreen}
	 */
	error(displayMessage) {
		this.requestAnimationFrame(()=>{
			this.cache.$template.addClass('template-hidden');
			this.cache.$templateError.removeClass('template-hidden');
			this.cache.$templateError.addClass('error');
			this.isAnimatingAlert = true;
		});
		return this;
	}

	/**
	 * Nascode la loading screen
	 * @version 1.0.0
	 * @public
	 * @return {LoadingScreen}
	 */
	hide() {
		this.counter--;
		if (this.counter > 0) return;
		if (this.timeout) clearTimeout(this.timeout);
		if ( this.timeoutHide ) return;

		this.timeoutHide =
			setTimeout(() => {
				this.requestAnimationFrame(()=>{
					this.timeoutHide = null;
					if ( this.$el.hasClass('show') ){
						this.$el.removeClass('show');
						this.$el.addClass('hide');
						this.randomize();
						this.isHiding = true;
					}
				});
			}, 500);

		return this;
	}

	/**
	 * Resetta la loading screen
	 * @version 1.0.0
	 * @public
	 * @return {LoadingScreen}
	 */
	reset() {
		this.requestAnimationFrame(()=>{
			this.isHiding = false;
			this.isAnimatingAlert = false;

			this.cache.$template.removeClass('template-hidden');
			this.cache.$templateSuccess.addClass('template-hidden');
			this.cache.$templateError.addClass('template-hidden');

			this.cache.$templateSuccess.removeClass('success');
			this.cache.$templateError.removeClass('error');
		});

		return this;
	}

	onAnimationEnd(e) {
		if (this.isHiding) {
			this.trigger('screenAnimationEnd', e);
			this.reset();
		}
		else if (this.isAnimatingAlert) {
			setTimeout(() => {
				this.hide();
			}, 500);
		}
	}

	onTouchMove(e) {
		e.preventDefault();
		e.stopPropagation();
	}

	/**
	 * Ritorna se la view è visualizzata oppure no
	 * @version 1.0.0
	 * @public
	 * @return {Boolean}
	 */
	isVisible() {
		return this.$el.hasClass('show');
	}

}
