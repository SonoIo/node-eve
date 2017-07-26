
let performance = {
	start: window.__start || (new Date()).getTime()
};
let performanceHistory = [];
let lastMeasurement = performance.start;

export default class Performance {

	static measure(title) {
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
		}
		else {
			performance[title] = {
				title: title,
				measure: measure,
				duration: measure - lastMeasurement,
				durationFromStart: measure - performance.start,
				relativeTo: relativeTo,
				index: performanceHistory.length
			};
			performanceHistory.push(performance[title]);
		}
		lastMeasurement = measure;
	}

	static print() {
		var aPerf, aMethod = 'log';
		for (var i = 0, n = performanceHistory.length; i < n; i++) {
			aPerf = performanceHistory[i];
			if ( window.__nativeLog ){
				window.__nativeLog[aMethod]('%s> %s (%sms)', loadingBar(aPerf.durationFromStart, aPerf.duration), aPerf.title, aPerf.duration);
			} else {
				console[aMethod]('%s> %s (%sms)', loadingBar(aPerf.durationFromStart, aPerf.duration), aPerf.title, aPerf.duration);
			}
		}

		function loadingBar(durationFromStart, duration) {
			var result = '';
			var n      = Math.floor(durationFromStart / 100);
			var s      = Math.floor((durationFromStart - duration) / 100);
			for (var i = 0; i < n; i++) {
				if (i < s) {
					result += ' ';
				}
				else if (i % 10 === 0) {
					result += '=';
				}
				else {
					result += '=';
				}
			}
			return result;
		}
	}

}

Performance.db      = performance;
Performance.history = performanceHistory;
window.__p = Performance;
