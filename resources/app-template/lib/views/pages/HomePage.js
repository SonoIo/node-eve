import _ from 'underscore';
import context from 'context-utils';
import AppPage from '../AppPage';
import PagesController from '../../controllers/PagesController';
import { l } from '../../utils';

const STATUS_LOADING = 'loading';
const STATUS_READY = 'ready';

export default class HomePage extends AppPage {

	addClass() {
		return 'homepage';
	}

	constructor(options) {
		super(options);
		const state = this.getState();

		this.template = require('../../../templates/pages/home.html');

		this.addEvents({
			'click .js-alert': 'onButtonClick'
		});
	}

	//
	// Events
	//

	onRender(rendered) {
		super.onRender(rendered);
		if (!rendered) {
			this.cache.$content.html(this.template({
				l: l
			}));
			this.cache.$alertButton = this.cache.$content.find('.js-alert');
			this.changeStatus(STATUS_LOADING);
			setTimeout(() => {
				this.changeStatus(STATUS_READY);
			}, 2000);
		}
	}

	onNavigate() {
		// Analytics
		context.pubsub.trigger('analytics', 'homepage');
	}

	onEnterStatus(oldStatus, newStatus) {
		switch (newStatus) {
			case STATUS_LOADING:
				this.disableButton();
				break;
			case STATUS_READY:
				break;
		}
	}

	onExitStatus(oldStatus, newStatus) {
		switch (oldStatus) {
			case STATUS_LOADING:
				this.enableButton();
				break;
			case STATUS_READY:
				break;
		}
	}

	onButtonClick() {
		this.showAlert();
	}

	//
	// Methods
	//

	disableButton() {
		this.cache.$alertButton.prop('disabled', true);
	}

	enableButton() {
		this.cache.$alertButton.prop('disabled', false);
	}

	showAlert() {
		if (this.status !== STATUS_READY) return;
		PagesController.showAlert({
			title: l('HOME_PAGE->ALERT_TITLE'),
			message: l('HOME_PAGE->ALERT_MESSAGE'),
			buttonName: l('HOME_PAGE->ALERT_BUTTON')
		});
	}

}
