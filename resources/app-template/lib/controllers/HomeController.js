import context from "context-utils";
import HomePage from "../views/home/HomePage";

export default class HomeController {

	// Middleware
	static openHomeMiddleware(context, next) {
		HomeController.openHome();
		return next();

		// Waiting version
		// PagesController.openHome(()=>{
		// 	return next();
		// });
	}

	// Home logic
	static openHome(){
		console.log("Welcome to home!");
		const view = new HomePage({});
		context.viewstack.pushView(view,{animated: true});
	}



}
