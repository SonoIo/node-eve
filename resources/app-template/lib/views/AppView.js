import _ from "underscore";
import { BaseView } from "backbone.uikit";

BaseView.prototype.initialize = function initialize(){
	// this.isTablet  = context.device.isTablet();
	// this.isAndroid = context.device.isAndroid();
	// this.isIos     = context.device.isIphone() || context.device.isIpad();
	// if ( this.isTablet && this.onChangeViewport ) {
	// 	this.listenTo( context.device, 'changeViewport', this.onChangeViewport );
	// }
}


export default class AppView extends BaseView {

	constructor(options){
		super(options);
	}

}
