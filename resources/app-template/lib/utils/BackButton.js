import _ from "underscore";
import context from "context-utils";
import {l} from "./localizations";
import { NavigationModalView } from "backbone.uikit";

/**
 * Classe di utility per controllare il tasto back dei dispositivi Android
 * @version 1.0.0
 */
export default class BackButton {

	static middleware(options) {
		return function (ctx, next) {
			context.backbutton = new BackButton(options);
			return next();
		};
	}

	constructor(options) {
		this.options = _.defaults(options||{},{
			messageClose: l('BACK_BUTTON->CLOSE_MESSAGE'),
			timeoutNotify: 3500
		});
		this.on();
		this.firstTimePressed = false;
	}

	/**
	 * Si mette in ascolto del button back. In sviluppo ascolta un evento sul pubsub
	 * @public
	 * @version 1.0.0
	 */
	on() {
		if (global.env.APP_ENV === 'development') {
			context.pubsub.on('backbutton', _.bind(this.onBackButton, this));
		}
		document.addEventListener('backbutton', _.bind(this.onBackButton, this), false);
	}

	/**
	 * Spegne l'ascolto dell'evento del button back
	 * @public
	 * @version 1.0.0
	 */
	off() {
		document.removeEventListener('backbutton', _.bind(this.onBackButton, this), false);
	}

	/**
	 * Uscita dell'applicazione
	 * @public
	 * @version 1.0.0
	 */
	exit() {
		if (navigator.app && navigator.app.exitApp)
			return navigator.app.exitApp();
	}

	/**
	 * Evento di back button
	 * @public
	 * @version 1.0.0
	 */
	onBackButton(e) {
		if (e) e.preventDefault();

		if (context.loadingScreen && context.loadingScreen.isVisible()) return false;

		let tabs = context.tabs;
		let viewstack;
		let size;
		let modalView = null;
		let onboarding = false;


		if (context.viewstack.size() === context.viewstack._length) {
			viewstack = tabs.getActiveState().get('viewstack');
		} else {
			let activeView = context.viewstack.getViewActive();
			if (activeView instanceof NavigationModalView) {
				modalView = activeView;
				viewstack = activeView.getState().get('viewstack');
			} else {
				viewstack  = context.viewstack;
				onboarding = !context.app.isReady();
			}
		}

		size = viewstack.size();

		if (size === 1 || onboarding) {
			if (modalView) {
				modalView.close();
			} else if (this.firstTimePressed) {
				this.exit();
			} else if (tabs && tabs.getActiveTabName() !== 'home' && !onboarding) {
				context.page.navigate('home', { trigger: true });
			} else {
				context.pubsub.trigger('notify', this.options.messageClose , {
					autohide: true,
					timeout:  this.options.timeoutNotify,
					showIcon: false
				});
				this.firstTimePressed = true;
				setTimeout(() => {
					this.firstTimePressed = false;
				}, 3500);
			}
		} else {
			let active = viewstack.getActiveViewWithOptions();
			if (active) {
				viewstack.popView(active.view, { animated: active.options.animated });
			}
		}

		return false;
	}

}
