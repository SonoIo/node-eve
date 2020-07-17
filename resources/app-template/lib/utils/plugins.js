import _ from "underscore";
import context from "context-utils";
/**
 * Richiede l'autenticazione con il FingerPrint se il dispositivo è abilitato
 * @version 1.0.0
 * @param {Object} options
 * @param {Function} done - Callback di ritorno dopo l'interogazione della parte nativa
 */
export function requestFingerPrint(options, done) {
	if (_.isFunction(options)) {
		done    = options;
		options = {};
	}

	let fp = context.fingerprint;
	return fp.show(options, (statusCode) => {
		switch ( statusCode ) {
			case fp.NOT_AVAILABLE:
				console.log("--------> Request fingerprint: NOT AVAILABLE");
				return done(true);
				break;
			case fp.NOT_ENABLED_BY_USER:
				console.log("--------> Request fingerprint: NOT ENABLED BY USER");
				return done(true);
				break;
			case fp.NOT_ALLOWED:
				console.log("--------> Request fingerprint: NOT ALLOWED");
				return done(false);
				break;
			case fp.ALREADY_UNLOCKED:
				console.log("--------> Request fingerprint: UNLOCKED ");
				return done(true);
				break;
			case fp.UNLOCKED:
				console.log("--------> Request fingerprint: UNLOCKED ");
				return done(true);
				break;
		}
	});
}

/**
 * Chiude la tastiera tramite un plugin nativo
 * @version 1.0.0
 */
export function closeKeyboard() {
	if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
		window.cordova.plugins.Keyboard.close();
	}else if ( window.Keyboard && window.Keyboard.hide){
		window.Keyboard.hide();
	}


}

/**
 * Blocca l'orientazione corrente
 * @version 1.0.0
 * @param {Function} done Callback di ritorno
 */
export function lockCurrentOrientation(done) {
	if (window.screen && window.screen.lockOrientation && !context.cache.get('lockOrientation')) {
		let viewport = context.device.getViewport();
		window.screen.lockOrientation(viewport.orientation);
	}
	if (done) setTimeout(() => done(), 100);
}

/**
 * Sblocca il cambio orientazione del dispositivo
 * @version 1.0.0
 * @param {Function} done Callback di ritorno
 */
export function unlockOrientation(done) {
	if (window.screen && window.screen.unlockOrientation && !context.cache.get('lockOrientation')) {
		window.screen.unlockOrientation();
	}
	if (done) setTimeout(() => done(), 100);
}

/**
 * Riavvia l'applicazione nell'url corrente
 * @version 1.0.0
 */
export function restartApp() {
	// Attivo lo splashscreen
	if (navigator.splashscreen) navigator.splashscreen.show();
	// Riavvio l'app
	location.reload();
}
