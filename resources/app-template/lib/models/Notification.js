import _ from "underscore";
import { Model } from "backbone";
import { l } from "../utils";

export default class Notification extends Model {

	defaults() {
		return {
			product:    null,
			title:      "",
			message:    "",
			categoryId: null,
			autohide:   true,
			timeout:    6000,
			view:       'NotificationView',
			showIcon:   true,
			customCss:  null,
			vibrate:    false
		};
	}

	parse(res,options) {
		if (res && res.message) {
			// Controllo se sono errori custom del server che non possono essere tradotti
			switch (res.message) {
				case "UnknownError":                    res.message = l('SERVER_ERROR->UNKNOWN_ERROR'); break;
				case "Bad credentials":                 res.message = l('SERVER_ERROR->BAD_CREDENTIALS'); break;
				case "InsufficientStockError":          res.message = l('SERVER_ERROR->INSUFFICIENT_STOCK_ERROR'); break;
				case "Facebook auth failed":            res.message = l('SERVER_ERROR->FACEBOOK_AUTH_FAILED'); break;
				case "abort":                           res.message = l('SERVER_ERROR->ABORT'); break;
				case "timeout":                         res.message = l('SERVER_ERROR->TIMEOUT'); break;
				case "no image selected":               res.message = l('CDV_PLUGIN_CAMERA->NO_IMAGE_SELECTED'); break;
				case "Selection cancelled.":            res.message = l('CDV_PLUGIN_CAMERA->SELECTION_CANCELLED'); break;
				case "Camera cancelled.":               res.message = l('CDV_PLUGIN_CAMERA->CAMERA_CANCELLED'); break;
				case "Location services are disabled.": res.message = l('CDV_PLUGIN_GEO->SERVICES_DISABLED'); break;
				default:
					if ( (/<!doctype/i).test(res.message) || (/<html/i).test(res.message) ) {
						res.message = l('SERVER_ERROR->INTERNAL_ERROR');
					}
				break;
			}
		}
		return res;
	}

}
