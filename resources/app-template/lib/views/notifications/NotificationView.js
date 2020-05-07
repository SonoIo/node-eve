import _ from "underscore";
import $ from "jquery";
import context from "context-utils";
import { BaseView } from "backbone.uikit";
import { stripTags } from "../../utils";

/**
 * Classe base per ogni tipo di messaggio da notificare all'utente
 * mediande una tendina a comparsa.
 * @version 1.0.0
 */
export default class NotificationView extends BaseView {

	className() {
		return 'notification';
	}

	constructor(options) {
		super(options);

		this.addEvents({
			'click':     'onClick',
			'touchmove': 'onTouchMove'
		});

		// La notifica è già in chiusura
		this.cache.hiding = false;
		this.cache.timer  = null;

		let customCss = this.model.get('customCss');
		if ( customCss )
			this.$el.addClass(customCss);

		// Categoria
		let categoryId = this.model.get('categoryId');
		if (categoryId) {
			this.$el.addClass(categoryId.toLowerCase() + '-category-color');
		}

		// Se chiudi automaticamente è abiltiato aggiunge la classe e fa sparire
		// la X per chiudere la notifica
		let autohide = this.model.get('autohide');
		if (autohide) {
			this.$el.addClass('autohide');
			this.startTimer();
		}

		this.debounce('onClick');
	}

	onRender(rendered) {
		const { $el, cache, model } = this;
		if (!rendered) {
			cache.$content = $('<div class="content">');
			cache.$title   = $('<div class="title">');
			cache.$message = $('<div class="message">');

			cache.$title.text( stripTags(model.get('title')) );
			cache.$message.text( stripTags(model.get('message')) );

			$el.append( cache.$content.append(cache.$title, cache.$message) );
			if ( model.get('showIcon') ){
				cache.$icon = $('<i class="success-icon icon-check">');
				$el.append(cache.$icon);
			}

		}
	}

	startTimer() {
		if (this.cache.timer){
			clearTimeout(this.cache.timer);
			this.cache.timer = null;
		}
		this.cache.timer = setTimeout(() => {
			this.cache.timer = null;
			this.hide();
		}, this.model.get('timeout'));
	}

	hide() {
		const { el, cache } = this;
		if (cache.hiding) return;
		cache.hiding = true;

		this.requestAnimationFrame(()=>{
			el.addEventListener('animationend', _.bind(this.onHideAnimationEnd, this) );
			el.classList.add('hide');
			context.pubsub.trigger('notify-hide');
		});
	}

	onHideAnimationEnd (event) {
		// this is the notification transition
		// target: this.el
		this.cache.hiding = false;
		event.target.removeEventListener('animationend', this.onHideAnimationEnd);
		this.destroy();
	}

	onClick(e) {
		e.preventDefault();
		e.stopPropagation();
		this.hide();
	}

	onTouchMove(e) {
		e.preventDefault();
		e.stopPropagation();
		this.hide();
	}

	onDestroy() {
		if (this.cache.timer) {
			clearTimeout(this.cache.timer);
		}
		super.onDestroy();
	}

}
