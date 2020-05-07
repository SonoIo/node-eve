import _                  from "underscore";
import _s                 from "underscore.string";
import context            from "context-utils";

/**
 * Ottiene la url del CDN per gli asset statici.
 * @version 1.0.0
 * @param {String} url - Model {@link Customer}
 * @return {String} - Url statico della risorsa
 */
let urlMapCache = {};
export function getStaticUrl(url) {
	if (url && urlMapCache[url]) return urlMapCache[url];
	let urls = global.env.STATIC_URLS || [];
	if (!_.isArray(urls)) urls = [ urls ];

	let index = Math.floor( (Math.random() * urls.length ) );
	if (url) urlMapCache[url] = urls[ index ];
	return urls[ index ];
}

/**
 * Restituisce l'URL base del server
 * @version 1.0.0
 * @return {String} - URL base del server
 */
export function getBaseUrl() {
	return `${getAPIUrl()}`;
}

/**
 * Restituisce l'URL del server API
 * @version 1.0.0
 * @return {String} - URL base del server
 */
export function getAPIUrl() {
	return global.env.API_URL;
}

/**
 * Apre l'URL indicata. Ad esempio può aprire una schermata dell'app
 * o un sito internet.
 * @version 1.0.0
 * @param {String} url - URL corrispondente alla risorsa da visualizzare
 */
export function openUrl (url) {
	if (!url || !_.isString(url)) return;
	url = _s.ltrim(url, '/');
	context.page.openUrl(url);
}


/**
 * Apre l'URL nel website
 * @version 1.0.0
 * @param {String} url
 * @return {String}
 */
export function openOnSystemBrowser(url, queryString) {
	if (!url) return;
	if (url.indexOf('http') !== 0) {
		url = global.env.WEB_SITE_URL + url;
	}
	if (queryString) url += (url.indexOf('?') > -1 ? '&' : '?') + queryString;
	if (!window.cordova || !window.cordova.InAppBrowser) return window.open(url, '_blank');

	let options = '';
	if ( context.device.isAndroid() ){
		options = "location=yes,closebuttoncolor=#ffffff,toolbarcolor=#C78A69,navigationbuttoncolor=#ffffff";
	}else{
		options = `location=no,closebuttoncaption=${l("IN_APP_BROWSER->CLOSE_BUTTON")},closebuttoncolor=#ffffff,toolbarcolor=#C78A69,navigationbuttoncolor=#ffffff,usewkwebview=yes`;
	}
	window.cordova.InAppBrowser.open(url, '_blank', options);

	// if (context.device.isAndroid()) {
	// 	window.cordova.InAppBrowser.open(url, '_blank', 'location=yes');
	// } else {
	// window.cordova.InAppBrowser.open(url, '_system', '');
	// }
}

/**
 * Chiama al telefono il numero passato come parametro
 * @param  {String} phoneNumber
 */
export function call(phoneNumber) {
	if (_s.isBlank(phoneNumber) || !_.isString(phoneNumber)) return;
	let sanitizedPhoneNumber = (phoneNumber || '').replace(/\s/g, '');
	return window.open('tel:' + sanitizedPhoneNumber, '_system');
}
