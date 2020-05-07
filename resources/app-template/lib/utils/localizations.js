import context from "context-utils";

const requireLocalizations = require('../../localizations/output/all');

export function getLanguageCode () {
	// https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes
	return context.locale || global.env.DEFAULT_LANGUAGE;
}

export function getCountryCode (format) {
	// https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
	if (format === 'alpha-3') return 'ITA';
	return 'IT';
}

export function getCurrencyCode () {
	// https://en.wikipedia.org/wiki/ISO_4217
	return 'EUR';
}

export function getCurrencySymbol (code) {
	// https://en.wikipedia.org/wiki/ISO_4217
	if (!code) code = getCurrencyCode();
	if (code === 'EUR') return '€';
	if (code === 'GBP') return '£';
	if (code === 'USD') return '$';
	if (code === 'INR') return '₹';
}

export function getL (language) {
	if (!language) language = getLanguageCode();
	return requireLocalizations(language);
}

export function l () {
	const a1 = arguments[0], a2 = arguments[1], a3 = arguments[2];
	switch (arguments.length) {
		case 0: return getL().call(global, a1);
		case 1: return getL().call(global, a1, a2);
		case 2: return getL().call(global, a1, a2, a3);
		default: return getL().apply(global, arguments);
	}
}
