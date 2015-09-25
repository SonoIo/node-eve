var watch = require('node-watch');
var path = require('path');

module.exports = function (options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}

	var match = options.match || /\.(js|json|html|scss|css)$/;

	var blackList = ['bundle.js'];

	var dirsAndFiles = [
		'package.json',
		'templates',
		'locales',
		'lib',
		'test',
		'styles'
	].map(function (filename) {
		return path.resolve(filename);
	});

	watch(dirsAndFiles, { recursive: true, followSymLinks: true }, filter(match, update));
	callback(true, true);

	function filter(pattern, fn) {
		return function (filename) {
			if (blackList.indexOf(path.basename(filename.toLowerCase())) === -1) {
				if (pattern.test(filename)) {
					fn(filename, path.extname(filename));
				}
			}
		}
	}

	function update(filename, ext) {
		var isJs = ['.js', '.json', '.html'].indexOf(ext) !== -1;
		var isCss = ['.css', '.scss'].indexOf(ext) !== -1;
		callback(isJs, isCss);
	}
};