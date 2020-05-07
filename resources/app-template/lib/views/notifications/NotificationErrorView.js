import _ from "underscore";
import $ from "jquery";
import context from "context-utils";
import { ImageView, style } from "backbone.uikit";
import NotificationView from "./NotificationView";

export default class NotificationErrorView extends NotificationView {

	className() {
		return 'notification notification-error';
	}

}
