import _ from "underscore";
import context from "context-utils";
import { l } from "../utils";

let cachedLanguages = null;
function getLanguages() {
	if (!cachedLanguages) {
		cachedLanguages = {
			'de': l('LANGUAGES->DE'), // Tedesco
			'en': l('LANGUAGES->EN'), // Inglese
			'es': l('LANGUAGES->ES'), // Spagnolo
			'fr': l('LANGUAGES->FR'), // Francese
			'it': l('LANGUAGES->IT'), // Italiano
			'ja': l('LANGUAGES->JA'), // Giapponese
			'ko': l('LANGUAGES->KO'), // Koreano
			'ru': l('LANGUAGES->RU'), // Russo
		};
	}
	return cachedLanguages;
}

/**
 * Restituisce la lingua attuale del dispositivo. Viene calcolata
 * automaticamente dal dispositivo in fase di avvio dell'app.
 * @version 1.0.0
 * @return {String} - Codice della lingua
 */
let cachedLanguage;
export function getLanguage() {
	if (!cachedLanguage) cachedLanguage = context.settings.get('language'); // settings
	if (!cachedLanguage) cachedLanguage = context.cache.get('language');    // language detector
	if (!cachedLanguage) cachedLanguage = global.env.DEFAULT_LOCALE;      // default
	return cachedLanguage;
}

/**
 * Metodo che indica con un booleano se la lingua specificata è in whitelist
 * @param  {String}  lang lingua
 * @return {Boolean}
 */
export function isWhitelistLanguage(lang) {
	return global.env.LANGUAGE_WHITELIST.indexOf(lang) !== -1;
}

/**
 * Restituisce la lingua da usare controllando la whitelist. Se la lingua
 * desiderata non è presente, viene restituita la lingua di default.
 * NOTE: ATTENZIONE! Le whitelist vanno definite per ogni app nel config.json
 * @param  {String} countryCode country desiderata
 * @return {String}             country da adottare
 */
export function getWhitelistedLanguage(language) {
	if (!language) return global.env.DEFAULT_LOCALE;
	language = language.toLowerCase();
	if (!isWhitelistLanguage(language)) return global.env.DEFAULT_LOCALE;
	return language;
}

/**
 * Restituisce il nome per esteso della lingua passata come parametro
 * @version 1.0.0
 * @return {String} Nome della lingua
 */
export function getLanguageName(lang) {
	if (!lang) lang = getLanguage();
	let languages = getLanguages();
	if (!_.has(languages, lang)) return null;
	return languages[lang];
}

/**
 * Restituisce l'array strutturato delle lingue con campi 'value' e 'label'
 * @version 1.0.0
 * @return {Array}
 */
export function getLanguagesArray(options) {
	options = _.defaults(options || {}, {
		whitelist: false
	});
	let languages = getLanguages();
	let languagesArray = [];
	_.forEach(_.keys(languages), (lang) => {
		if ((options.whitelist && isWhitelistLanguage(lang)) || !options.whitelist) {
			languagesArray.push({
				value: lang,
				label: languages[lang]
			});
		}
	});
	return languagesArray;
}

/**
 * Restituisce un oggetto rappresentante una lingua con campi 'value' e 'label'
 * @version 1.0.0
 * @return {Object}
 */
export function getLanguageObject(lang) {
	if (!lang) lang = getLanguage();
	return _.pick(getLanguagesArray(), (aLanguageName, aLang) => {
		return aLang == lang;
	});
}
