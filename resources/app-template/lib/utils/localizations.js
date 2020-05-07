import { getLanguage } from './index';

const requireLocalizations = require('../../localizations/output/all');

export function getL (language) {
	if (!language) language = getLanguage();
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
