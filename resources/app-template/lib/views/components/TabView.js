import _ from "underscore";
import context from "context-utils";
import {trim, dasherize} from "underscore.string";
import $ from "jquery";
import { State } from "backbone.uikit";
import Viewstack from "backbone.viewstack";
import device from "device-utils";
import AppView from "../AppView";
import { NavigationView } from "backbone.uikit";


export default class TabView extends AppView {

	className() {
		return 'tab-bar';
	}

	constructor(options) {
		super(options);

		this.options = _.defaults(this.options, {
			tabs: [],
			navigation: true,
			navigationClass: NavigationView
		});

		this._activeTab = '';
		this._prevTab   = '';

		// States
		this.states = context.states = {};
		this.tabOptions = {};
		this.tabActions = {};
		var aState, aViewstack, aNavigation;

		let events = {};
		const navigationEnabled = this.options.navigation;
		const NavigationClass   = this.options.navigationClass;
		this.options.tabs.forEach(tab => {
			// console.log( tab );
			if (!tab.virtual) {
				aState     = this.states[tab.route] = new State();
				aViewstack = new Viewstack({
					className: 'viewstack'
				});
			} else {
				aState     = this.states[tab.route] = context.state;
				aViewstack = context.state.get('viewstack');
			}

			if ( navigationEnabled ){
				aNavigation = new NavigationClass({
					viewstack: aViewstack,
					state: aState,
					masterDetail: tab.masterDetail
				});
				aState.set('navigation', aNavigation);
			}

			this.tabOptions[tab.route] = tab;
			this.tabActions[tab.route] = tab.action;

			aState.set('viewstack', aViewstack);
			this.listenTo(aViewstack, 'pushed popped clear', this.showTabBar);
		});

		this.addEvents({
			'click .js-button': 'onButtonClick'
		});

		// this.debounce('onButtonClick');
	}

	getActiveState() {
		return this.states[this._activeTab];
	}

	/**
	 * Ritorna il nome della tab bar
	 * @return {String} - Nome della tab
	 */
	getActiveTabName() {
		return this._activeTab;
	}

	getAnimationPushDuration(){
		return 0;
	}

	onRender(rendered) {
		if (!rendered) {
			let $tabBarContent = $('<div class="tab-bar-content" />');
			let $tabBarToolbar = $('<div class="tab-bar-toolbar" />');

			// Indica i bottoni attivi al momento
			let activeButton = _.size(this.options.tabs) - _(this.options.tabs).filter((tab)=>{ return _.result(tab, 'visible') == false; }).length;
			let widthTab     = activeButton > 0 ? 100 / activeButton : 0;

			let aState, $aPage, $aButton, activeTab = 0;
			this.options.tabs.forEach(tab => {
				tab    = _.defaults(tab, { visible: true, preRender: false });
				aState = this.states[tab.route];

				$aPage   = $(`<div class="tab-bar-content-page ${dasherize(trim(tab.route))} js-${dasherize(trim(tab.route))}" />`);
				$aButton = $('<span class="tab-bar-toolbar-button js-button" />')
								.data('tab', tab)
								.attr('id', tab.route )
								.css({
									'-webkit-flex-basis': `${widthTab}%`,
									'flex-basis': `${widthTab}%`
								});

				if ( tab.badge ){
					$aButton.append( $('<span class="tab-bar-toolbar-button-badge" />').text( tab.badge ) );
				}

				if ( tab.icon ){
					$aButton.append( $(`<i class="icon ${tab.icon}" />`) );
				}

				if ( tab.label ){
					$aButton.append( $('<span class="tab-bar-toolbar-button-label" />').html( tab.label ) );
				}

				if ( _.result(tab,'visible') ){
					$aButton.get(0).style.display = 'block';
					activeTab++;
				} else {
					$aButton.get(0).style.display = 'none';
				}

				this.cache['$' + tab.route + 'Button'] = $aButton;
				this.cache['$' + tab.route + 'Page']   = $aPage;

				if (!tab.virtual) {
					$tabBarContent.append( $aPage );
					$aPage.append(aState.get('viewstack').el);
				}

				$tabBarToolbar.append( $aButton );

				if ( this.options.navigation ){
					$aPage.append(aState.get('navigation').el);
					aState.get('navigation').render();
				}

				if ( tab.preRender ){
					let fn = aState.get("tabAction");
					if ( _.isFunction(fn) ){
						fn(context, { preRender: true, state: aState }, ()=>{});
					}
				}

			});

			if (this._activeTab) {
				this.cache['$' + this._activeTab + 'Button'].addClass('active');
				this.cache['$' + this._activeTab + 'Page'].get(0).style.display = 'block';
			}

			// let widthTab = activeTab > 0 ? (100 / activeTab) : 0;

			this.$el.append( $tabBarContent, $tabBarToolbar );
			// this.cache.$cartEntryCount = this.$el.find('.js-tab-bar-toolbar-cart-count');
			// this.cache.cartEntryCount  = this.cache.$cartEntryCount.get(0);
			// this.cache.$cartEntryCount.text( context.cart.get('totalUnitCount')||0 );
		}
	}

	/**
	 * Nasconde una tab (bottone e pagina). In opzione si può visualizzare/nascondere il solo bottone
	 * @version 1.0.0
	 * @public
	 * @param {String} tab - Chiave che identifica la Tab
	 * @param {Boolean} onlyButton - Se impostato a true, nasconde solamente il bottone nella TabBar.
	 * @return {TabView}
	 */
	hideTab(tab, onlyButton = false){
		return this.enableTab(tab, false, onlyButton);
	}

	/**
	 * Visualizza una tab (bottone e pagina). In opzione si può visualizzare/nascondere il solo bottone
	 * @version 1.0.0
	 * @public
	 * @param {String} tab - Chiave che identifica la Tab
	 * @param {Boolean} onlyButton - Se impostato a true, nasconde solamente il bottone nella TabBar.
	 * @return {TabView}
	 */
	showTab(tab, onlyButton = false){
		return this.enableTab(tab, true, onlyButton);
	}

	showBarShadow() {
		this.requestAnimationFrame(()=>{
			this.el.classList.add('shadow');
		});
	}

	hideBarShadow() {
		this.requestAnimationFrame(()=>{
			this.el.classList.remove('shadow');
		});
	}

	/**
	 * Visualizza / Nasconde una tab (bottone e pagina). In opzione si può visualizzare/nascondere il solo bottone
	 * @version 1.0.0
	 * @public
	 * @param {String} tab - Chiave che identifica la Tab
	 * @param {Boolean} onlyButton - Se impostato a true, nasconde solamente il bottone nella TabBar.
	 * @return {TabView}
	 */
	enableTab(tab, enable, onlyButton = false){
		this.requestAnimationFrame(()=>{
			let button = this.cache['$' + tab + 'Button'];
			let page   = this.cache['$' + tab + 'Page'];

			if (!button) return this;
			if (!page) return this;

			button = button.get(0);
			page   = page.get(0);

			let display = enable ? 'block' : 'none';

			if ( !onlyButton ){
				button.style.display = display;
				page.style.display   = display;
			}else{
				button.style.display = display;
			}

			let activeButtons = this.$el.find('.js-button:visible');
			let widthTab      = activeButtons.length > 0 ? 100 / activeButtons.length : 0;

			activeButtons.each((index, button)=>{
				button.style['-webkit-flex-basis'] = `${widthTab}%`;
				button.style['flex-basis'] = `${widthTab}%`;
			});

		});
		return this;
	}

	/**
	 * Aggiorna i componenti dei bottoni delle tab con i valori che vengono ricevuti.
	 * Se non esiste un componente che corrisponde a un paramentro, viene creato.
	 * Quando un valore è false (boolean) il corrispettivo componente viene rimosso.
	 * @param  {String} route                   Identifica il bottone della tab corretta
	 * @param  {Object} options                 Opzioni di aggiornamento
	 * @param  {Boolean | String} options.badge Testo da impostare al badge, se false rimuove il badge
	 * @param  {Boolean | String} options.icon  Classe dell'icona, se false rimuove l'icona
	 * @param  {Boolean | String} options.label Testo sotto l'icona, se false rimuove il testo
	 */
	updateTabButton(route, options) {
		this.requestAnimationFrame(() => {
			let $button = this.cache['$' + route + 'Button'];
			let $badge  = $button.find('.tab-bar-toolbar-button-badge');
			let $icon   = $button.find('i.icon');
			let $label  = $button.find('.tab-bar-toolbar-button-label');

			if (options.badge) {
				if ($badge.length <= 0) {
					$badge = $('<span class="tab-bar-toolbar-button-badge" />');
					$button.prepend( $badge );
				}
				$badge.text( options.badge ).show();
			} else if (options.badge === false) {
				if ($badge.length > 0) $badge.text('').hide();
			}

			if (options.icon) {
				if ($icon.length <= 0) {
					let $icon = $('<i/>');
					if ($label.length > 0) $label.before( $icon );
					else $button.append( $icon );
				}
				$icon.get(0).className = "icon " + options.icon;
				$icon.show();
			} else if (options.icon === false) {
				if ($icon.length > 0) $icon.hide();
			}

			if (options.label) {
				if ($label.length <= 0) {
					$label = $('<span class="tab-bar-toolbar-button-label" />');
					$button.append( $label );
				}
				$label.text( options.label ).show();
			} else if (options.label === false) {
				if ($label.length > 0) $label.text('').hide();
			}
		});
	}

	onButtonClick(ev){
		// ev.preventDefault();
		const $el = $(ev.currentTarget);

		const tab = $el.data('tab'); // _.findWhere(this.options.tabs, {route: this.options.tabs[$el.attr('id')]});
		if ( tab && tab.route ){
			this.navigate( tab.route );
			if ( tab.analyticName ){
				context.pubsub.trigger('analytics', 'toolbar_click', { tabIconName: tab.analyticName });
			}
		}
		// return false;
	}


	onDeactivate() {
		// this.$el.addClass('deactivate');
		// console.log('on deactivate');
		let activeState;
		let viewstack;
		let activeView;
		if (activeState = this.getActiveState()) {
			if (viewstack = activeState.get('viewstack')) {
				if (activeView = viewstack.getViewActive()) {
					if (activeView.onDeactivate) {
						activeView.onDeactivate();
					}
				}
			}
		}
	}

	onBeforeActivate() {
		// console.log('on onBeforeActivate');
		let activeState;
		let viewstack;
		let activeView;
		if (activeState = this.getActiveState()) {
			if (viewstack = activeState.get('viewstack')) {
				if (activeView = viewstack.getViewActive()) {
					if (activeView.onBeforeActivate) {
						activeView.onBeforeActivate();
					}
				}
			}
		}
	}

	onActivate(firstTime) {
		this.$el.removeClass('deactivate');
		let activeState;
		let viewstack;
		let activeView;
		if (activeState = this.getActiveState()) {
			if (viewstack = activeState.get('viewstack')) {
				if (activeView = viewstack.getViewActive()) {
					if (activeView.onActivate) {
						activeView.onActivate(firstTime);
					}
				}
			}
		}
	}

	// onChangeCart(cart){
	// 	let totalUnitCount = cart.get('productEntryNumber') || 0;
	// 	this.requestAnimationFrame( () => {
	// 		if ( totalUnitCount == 0 ){
	// 			this.cache.$cartEntryCount.removeClass('show');
	// 		}else{
	// 			if ( totalUnitCount > 99 ){
	// 				this.cache.$cartEntryCount.addClass('tab-bar-toolbar-cart-count-big-font');
	// 			}else {
	// 				this.cache.$cartEntryCount.removeClass('tab-bar-toolbar-cart-count-big-font');
	// 			}
	// 			this.cache.$cartEntryCount.text( totalUnitCount );
	// 			this.cache.$cartEntryCount.addClass('show');
	// 		}
    //
	// 	});
	// }

	navigate(newTab, options, done) {
		if ( _.isFunction(options) ){
			done = options;
			options = {};
		}
		if ( !_.isFunction(done) ) done = ()=>{};

		let state      = this.states[newTab];
		let viewstack  = state.get('viewstack');
		let navigation = state.get('navigation');
		let tabOptions = this.tabOptions[newTab];

		let prevTab    = this._activeTab;
		let prevState;
		let prevView;

		if (tabOptions.virtual) {
			let fn = this.tabActions[newTab];
			if (_.isFunction(fn)) {
				fn(context, options, done);
			}
			return;
		}

		if ( !_.isEmpty(prevTab) ){
			prevState  = this.states[prevTab];
			prevView   = prevState.get("viewstack").getViewActive();
		}

		_.defaults(options || (options = {}), {
			clear: tabOptions.alwaysClearStack || false,
			changeStatus: false,
			force: false
		});

		if (options.changeStatus === true)
			options.changeStatus = context.params[0];

		if (newTab == prevTab && !options.force) {
			// Lascio la prima view
			this.clearChildViews(newTab);
			changeStatus();
			return;
		}

		this._prevTab   = prevTab;
		this._activeTab = newTab;
		this.trigger('navigate', state, viewstack.size() === 0 );

		if (viewstack.size() === 0) {
			let fn = this.tabActions[newTab];
			if ( _.isFunction(fn) ){
				fn(context, options, done);
			}
		} else if (tabOptions.clearOnNavigate) {
			this.clearChildViews(newTab);
		}

		context.page.navigate(newTab, { trigger: false });

		// Forza la pulizia delle view.
		if ( options.clear ){
			this.clearChildViews(newTab);
		}

		// Comuncia alla view attiva che sta per essere visualizzata
		let activeView = viewstack.getViewActive();

		// Aspettiamo 2 tick per poter laciare il cambio tab
		window.requestNextAnimationFrame(()=>{

			// Attiva il cambio dello status
			changeStatus();

			if (this.rendered) {
				this.requestAnimationFrame(()=>{
					let newPage = this.cache['$' + newTab + 'Page'].get(0);

					this.cache['$' + newTab + 'Button'].addClass('active'); // Attivo il bottone
					newPage.classList.remove('deactivate');
					newPage.classList.add('active');

					if (activeView && activeView.onNavigate) {
						activeView.onNavigate();
					}

					if ( activeView && activeView.onActivate ) activeView.onActivate(false);
					if ( this.cache.toHideTab ) clearTimeout(this.cache.toHideTab);

					if (prevTab) {
						let prevPage = this.cache['$' + prevTab + 'Page'].get(0);
						// Se la tab di apertura ha un tempo di apparizione la eseguo
						if ( !tabOptions.timeOfAppearance || !_.isNumber(tabOptions.timeOfAppearance) || _.isNaN(tabOptions.timeOfAppearance) ){
							this.cache['$' + prevTab + 'Button'].removeClass('active');
							prevPage.classList.add('deactivate');
							prevPage.classList.remove('active');
							if ( prevView && prevView.onDeactivate ) prevView.onDeactivate();
						}else{
							prevPage.style.zIndex = 0;
							this.cache.toHideTab =
								setTimeout(()=>{
									this.cache.toHideTab = null;
									this.requestAnimationFrame(() => {
										this.cache['$' + prevTab + 'Button'].removeClass('active');
										prevPage.classList.add('deactivate');
										prevPage.classList.remove('active');
										if ( prevView && prevView.onDeactivate ) prevView.onDeactivate();
									});
								}, tabOptions.timeOfAppearance);
						}
					}
				});

			} // End if Rendered

		});// End requestNextAnimationFrame

		function changeStatus() {
			if (options.changeStatus) {
				// Per convenzione le view devono cambiare il loro status interno
				// tramite il metodo changeStatus
				let activeView = viewstack.getViewActive();
				if (activeView && activeView.changeStatus) {
					activeView.changeStatus(options.changeStatus);
				}
			}
		}
	}

	/**
	 * Naviga alla tab precedente
	 * @version 1.0.0
	 * @public
	 */
	back(options, done){
		return this.navigate(this._prevTab, options, done);
	}

	clearChildViews(tab) {
		let state = this.states[tab];
		let viewstack = state.get('viewstack');
		viewstack.clearStack(1);
		let activeView = viewstack.getViewActive();
		if (activeView) {
			activeView.getState().trigger('clearStack');
		}
	}

	clear(tab) {
		let state = this.states[tab];
		if (!state)
			throw new Error('Cannot find state named "' + tab + '"');
		let viewstack = state.get('viewstack');
		viewstack.clearStack(1);
	}

	clearAll() {
		_.forEach(this.states, (aState, aTabName) => {
			this.clearChildViews(aTabName);
		});
	}

	getButtonTab(tab){
		let $button = this.cache['$' + tab + 'Button'];
		if (!$button){
			return {
				el: null,
				top: 0,
				left: 0,
				width: 0,
				height: 0
			};
		}
		let position = $button.position() || {left: 0, top: 0};
		return {
			el: $button,
			top: position.top,
			left: position.left,
			width: $button.outerWidth(),
			height: $button.outerHeight()
		}
	}

	hideTabBar() {
		this.el.classList.add('hide-toolbar');
		this.el.classList.remove('show-toolbar');
	}

	showTabBar() {
		this.el.classList.remove('hide-toolbar');
		this.el.classList.add('show-toolbar');
	}

};
