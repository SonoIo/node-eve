import moment from "moment";
import momentIt from "moment/locale/it";
import momentDe from "moment/locale/de";
import momentFr from "moment/locale/fr";
import momentRu from "moment/locale/ru";
import momentKo from "moment/locale/ko";
import momentJa from "moment/locale/ja";
import momentEnAu from "moment/locale/en-au";
import momentEnCa from "moment/locale/en-ca";
import momentEnGb from "moment/locale/en-gb";
import momentEnIe from "moment/locale/en-ie";
import momentEnNz from "moment/locale/en-nz";
import momentEs from "moment/locale/es";
import { getWhitelistedCountryCode, getWhitelistedLanguage } from "../utils";

/**
 * Riceve dal dispositivo le impostazioni sulla regione, se è presente in
 * COUNTRY_WHITELIST imposta il codice della regione in minuscolo,
 * altrimenti restituisce DEFAULT_COUNTRY_CODE
 * @version 1.0.0
 */
export function countryDetector() {
	return (context, next) => {
		if (!window.navigator || !window.navigator.globalization) {
			context.cache.set('countryCode', global.env.DEFAULT_COUNTRY_CODE);
			return next();
		}
		window.navigator.globalization.getLocaleName((detectedLocale) => { // { value: 'it-IT' }
			let countryCode;
			let localeSplit = detectedLocale.value.split('-');
			if (localeSplit.length === 1)
				countryCode = localeSplit[0];
			else
				countryCode = localeSplit[1];
			context.cache.set('countryCode', getWhitelistedCountryCode(countryCode));
			return next();
		}, () => {
			return next();
		});
	};
}

/**
 * Riceve dal dispositivo le impostazioni sulla lingua. Se non è presente nei
 * dizionari allora utilizza DEFAULT_LOCALE.
 * @version 1.0.0
 */
export function languageDetector() {
	return (context, next) => {
		if (!window.navigator || !window.navigator.globalization) {
			context.cache.set('language', global.env.DEFAULT_LOCALE);
			context.locale = context.cache.get('language');
			moment.locale(global.env.DEFAULT_LOCALE + '-' + global.env.DEFAULT_COUNTRY_CODE);
			return next();
		}
		window.navigator.globalization.getPreferredLanguage((detectedLanguage) => { // { value: 'it-IT' }
			let language;
			let languageSplit = detectedLanguage.value.split('-');
			language = languageSplit[0];
			context.cache.set('language', getWhitelistedLanguage(language));
			context.locale = context.cache.get('language');
			const country = context.cache.get('countryCode') || '';
			moment.locale(context.locale + '-' + country);
			return next();
		}, () => {
			return next();
		});
	};
}
