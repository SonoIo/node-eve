import _           from "underscore";
import context     from "context-utils";
import $           from "jquery";
import moment      from "moment";
import {ImageView} from "backbone.uikit";
import { l, stripTags } from "../../utils";

import AppRateView from "../AppRateView";
import NotificationView     from "../notifications/NotificationView";


export default class PushNotificationView extends NotificationView {

	className() {
		return super.className() + ' ' + 'push-notificatin-view';
	}

	constructor(options){
		super(options);
	}

	onRender(rendered){
		super.onRender(rendered);
		const pushNotification = this.model.get('pushNotification');
		this.cache.$title.text(stripTags(pushNotification.get('title')));
		this.cache.$message.text(stripTags(pushNotification.get('body')));
	}

}
