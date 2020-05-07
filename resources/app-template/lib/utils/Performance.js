import context from "context-utils";

let performance = {
	start:       window.__start || (new Date()).getTime(),
	DOMLoad:     window.__DOMContentLoaded,
	cordovaLoad: window.__cordovaLoad,
	bundleLoad:  window.__bundleLoad,
	deviceReady: window.__deviceReady
};
let performanceHistory = [];
let lastMeasurement = performance.start;

/**
 * Utility che mostra le informazioni sulle tempistiche raccolte durante
 * l'avvio dell'app
 * @version 1.0.0
 * @type {Performance}
 */
export default class Performance {

	/**
	 * Effettua una misura di performance su un blocco di codice.
	 * Con la prima chiamata viene avviata la misurazione, con la seconda la si
	 * conclude e si memorizza il dato misurato.
	 * @version 1.0.0
	 * @public
	 * @param  {String}  title           Titolo della misurazione
	 * @param  {Boolean} [firebase=true] Indica se la misura effettuata deve essere riportata su Firebase
	 * @return {Function}                Funzione da richiamare per concludere la misurazione
	 */
	static measure(title, firebase = true) {
		let measure = (new Date()).getTime();
		let startMeasure;
		let relativeMeasurement;
		let relativeTo = false;
		if (title in performance) {
			relativeMeasurement = performance[title];
			relativeTo = true;
			startMeasure = relativeMeasurement.measure;
			performance[title].duration = measure - relativeMeasurement.measure;
			performance[title].durationFromStart = measure - performance.start;
			let indexOfRelativeMeasurement = relativeMeasurement.index;
			performanceHistory[indexOfRelativeMeasurement] = performance[title];
			if (firebase && window.FirebasePlugin && window.FirebasePlugin.startTrace) {
				setTimeout(() => window.FirebasePlugin.startTrace(title));
			}
		} else {
			performance[title] = {
				title:             title,
				measure:           measure,
				duration:          measure - lastMeasurement,
				durationFromStart: measure - performance.start,
				relativeTo:        relativeTo,
				index:             performanceHistory.length,
				firebase:          firebase
			};
			performanceHistory.push(performance[title]);
			if (firebase && window.FirebasePlugin && window.FirebasePlugin.stopTrace ) {
				setTimeout(() => window.FirebasePlugin.stopTrace(title));
			}
		}
		lastMeasurement = measure;
		return () => Performance.measure(title, firebase);
	}

	/**
	 * Overload del metodo measure() per le misurazioni che non devono essere
	 * riportate su Firebase
	 * @version 1.0.0
	 * @public
	 * @param  {String} title Titolo della misurazione
	 * @return {Function}     Funzione da richiamare per concludere la misurazione
	 */
	static debugMeasure(title) {
		return Performance.measure(title, false);
	}

	/**
	 * Metodo che mostra in console i dati raccolti dalle varie misurazioni
	 * e dall'avvio dell'app in fase di parse JavaScript
	 * @version 1.0.0
	 * @public
	 */
	static print(printStartUp = true) {
		// Rileggo il dato del bundle se stava ancora caricando
		if (!performance.bundleLoad) performance.bundleLoad = window.__bundleLoad;

		if (printStartUp) {
			let startUpDuration, firstPerf = performanceHistory[0];
			if (firstPerf) {
				startUpDuration = firstPerf.durationFromStart - firstPerf.duration;
			} else {
				startUpDuration = performance.bundleLoad;
			}
			const printStartUpPerformance = (title, duration, durationFromStart) => {
				Performance.printPerformance({ title, duration, durationFromStart }, 'log');
			};
			printStartUpPerformance('STARTUP', startUpDuration, startUpDuration);
			printStartUpPerformance('load DOM Content', performance.DOMLoad, performance.DOMLoad);
			printStartUpPerformance('load Cordova', performance.cordovaLoad, performance.cordovaLoad);
			printStartUpPerformance('load Bundle', performance.bundleLoad - performance.cordovaLoad, performance.bundleLoad);
		}

		for (var i = 0, n = performanceHistory.length; i < n; i++) {
			Performance.printPerformance(performanceHistory[i], 'log');
		}

		console.log("\nDevice ready fired after: %s ms", performance.deviceReady || 'N/D');
		console.log("\nApp ready fired after: %s ms", (performance['READY'] || performance['ready']).durationFromStart);
	}

	/**
	 * Metodo privato che visualizza in console una singola misurazione di performance
	 * @version 1.0.0
	 * @private
	 * @param  {Object} perf   Oggetto che rappresenta la performance misurata
	 * @param  {String} method Metodo di log sulla console
	 */
	static printPerformance(perf, method) {
		let message = `${Performance.loadingBar(perf.durationFromStart, perf.duration)}> ${perf.title} (${perf.duration}ms)`;
		if (!perf.firebase) message += ' DEBUG';
		if (window.__nativeLog) {
			window.__nativeLog[method](message);
		} else {
			console[method](message);
		}
	}

	/**
	 * Metodo privato che si occupa di generare le barre di avanzamento per le
	 * misurazioni di performance
	 * @version 1.0.0
	 * @private
	 * @param  {Number} durationFromStart Durata della misurazione a partire dall'avvio
	 * @param  {Number} duration          Durata della misurazione
	 * @return {String}                   Barra di caricamento generata sotto forma di stringa
	 */
	static loadingBar(durationFromStart, duration) {
		var result = '';
		var n      = Math.floor(durationFromStart / 100);
		var s      = Math.floor((durationFromStart - duration) / 100);
		for (var i = 0; i < n; i++) {
			if (i < s) {
				result += ' ';
			} else if (i % 10 === 0) {
				result += '=';
			} else {
				result += '=';
			}
		}
		return result;
	}

}

Performance.db      = performance;
Performance.history = performanceHistory;
window.__p = Performance;
