
// Application
export { default as Application } from "./Application";

// Performance
export { default as Performance } from "./Performance";

// Languages
export * from "./languages";

// Localizations
export * from "./localizations";

// Countries
export * from "./countries";

// Strip tags
export * from "./stripTags";

// Plugins
export * from "./plugins";

// URLs
export * from "./urls";

// Geolocation
export { default as GeolocationPlugin } from "./GeolocationPlugin";

// BackButton
export { default as BackButton } from "./BackButton";

// Dialogs
export { default as Dialogs } from "./Dialogs";

// Version
export * from "./version";

/**
 * Converte un valore in booleano, esempi:
 * toBoolean(number 0)            --> false
 * toBoolean(number 1)            --> true
 * toBoolean(number -1)           --> true
 * toBoolean(string 0)            --> false
 * toBoolean(string 1)            --> true
 * toBoolean(string cat)          --> false
 * toBoolean(boolean true)        --> true
 * toBoolean(boolean false)       --> false
 * toBoolean(undefined undefined) --> false
 * toBoolean(object null)         --> false
 * @param  {any} val input value
 * @return {Boolean} boolean-converted value
 */
export function toBoolean(val) {
	return (val == "true" || Boolean(Number(val)));
}

/**
 * Generator guid
 * @return {String}
 */
export function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
