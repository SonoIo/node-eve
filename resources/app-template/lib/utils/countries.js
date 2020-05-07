import _ from "underscore";
import context from "context-utils";
import { l } from "../utils";

let cachedCountries = null;
function getCountries() {
	if (!cachedCountries) {
		cachedCountries = {
			'at': l('COUNTRIES->AT'), // Austria
			'be': l('COUNTRIES->BE'), // Belgium
			'bg': l('COUNTRIES->BG'), // Bulgaria
			'hr': l('COUNTRIES->HR'), // Croatia
			'cy': l('COUNTRIES->CY'), // Cyprus
			'cz': l('COUNTRIES->CZ'), // Czech Republic
			'dk': l('COUNTRIES->DK'), // Denmark
			'ee': l('COUNTRIES->EE'), // Estonia
			'fi': l('COUNTRIES->FI'), // Finland
			'fr': l('COUNTRIES->FR'), // France
			'de': l('COUNTRIES->DE'), // Germany
			'gr': l('COUNTRIES->GR'), // Greece
			'hu': l('COUNTRIES->HU'), // Hungary
			'ie': l('COUNTRIES->IE'), // Ireland
			'it': l('COUNTRIES->IT'), // Italy
			'jp': l('COUNTRIES->JP'), // Japan
			'kr': l('COUNTRIES->KR'), // Korea
			'lv': l('COUNTRIES->LV'), // Latvia
			'lt': l('COUNTRIES->LT'), // Lithuania
			'lu': l('COUNTRIES->LU'), // Luxembourg
			'mt': l('COUNTRIES->MT'), // Malta
			'nl': l('COUNTRIES->NL'), // Netherlands
			'pl': l('COUNTRIES->PL'), // Poland
			'pt': l('COUNTRIES->PT'), // Portugal
			'ro': l('COUNTRIES->RO'), // Romania
			'sk': l('COUNTRIES->SK'), // Slovakia
			'si': l('COUNTRIES->SI'), // Slovenia
			'es': l('COUNTRIES->ES'), // Spain
			'se': l('COUNTRIES->SE'), // Sweden
			'gb': l('COUNTRIES->GB'), // United Kingdom
			'us': l('COUNTRIES->US')  // United States
		};
	}
	return cachedCountries;
}

/**
 * Restituisce l'attuale country. Viene calcolata automaticamente dal dispositivo
 * oppure scelto nelle impostazioni dell'app.
 * @version 1.0.0
 * @return {String} Codice della country in whitelist
 */
let cachedCountryCode;
export function getCountryCode() {
	if (!cachedCountryCode) cachedCountryCode = context.settings.get('countryCode'); // settings
	if (!cachedCountryCode) cachedCountryCode = context.cache.get('countryCode');    // country detector
	return cachedCountryCode;
}

/**
 * Metodo che indica con un booleano se la country specificata è in whitelist
 * @param  {String}  countryCode country
 * @return {Boolean}
 */
export function isWhitelistCountry(countryCode) {
	return global.env.COUNTRY_WHITELIST.indexOf(countryCode) !== -1;
}

/**
 * Restituisce la country da usare controllando la whitelist. Se la country
 * desiderata non è presente, viene restituita la country di default.
 * NOTE: ATTENZIONE! Le whitelist vanno definite per ogni app nel config.json
 * @param  {String} countryCode country desiderata
 * @return {String}             country da adottare
 */
export function getWhitelistedCountryCode(countryCode) {
	if (!countryCode) return global.env.DEFAULT_COUNTRY_CODE;
	countryCode = countryCode.toLowerCase();
	if (!isWhitelistCountry(countryCode)) return global.env.DEFAULT_COUNTRY_CODE;
	return countryCode;
}

/**
 * Restituisce il nome per esteso della country passata come parametro
 * @version 1.0.0
 * @return {String} Nome della country
 */
export function getCountryName(countryCode) {
	if (!countryCode) countryCode = getCountryCode();
	let countries = getCountries();
	if (!_.has(countries, countryCode)) return null;
	return countries[countryCode];
}

/**
 * Restituisce l'array strutturato delle countries con campi 'value' e 'label'
 * @version 1.0.0
 * @param {Boolean} options.whitelist flag per ottenere le country in whitelist
 * @return {Array}
 */
export function getCountriesArray(options) {
	options = _.defaults(options || {}, {
		whitelist: false
	});
	let countries = getCountries();
	let countriesArray = [];
	_.forEach(_.keys(countries), (countryCode) => {
		if ((options.whitelist && isWhitelistCountry(countryCode)) || !options.whitelist) {
			countriesArray.push({
				value: countryCode,
				label: countries[countryCode]
			});
		}
	});
	return countriesArray;
}

/**
 * Restituisce un oggetto rappresentante una country con campi 'value' e 'label'
 * @version 1.0.0
 * @return {Object}
 */
export function getCountryObject(countryCode) {
	if (!countryCode) countryCode = getCountryCode();
	return _.pick(getCountriesArray(), (aCountryName, aCountryCode) => {
		return aCountryCode == countryCode;
	});
}
