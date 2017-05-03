var watch = require('node-watch');
var path  = require('path');
var _     = require('underscore');

module.exports = function (options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}

	var match        = options.match || /\.(js|json|html|scss|css)$/;
	var dirsAndFiles = options.dirsAndFiles;
	var blackList    = options.blackList;

	if ( !_.isArray(blackList) )
		blackList = ['bundle.js', 'style.css', 'package.json'];
	if ( !_.isArray(dirsAndFiles) )
		dirsAndFiles = [];

	dirsAndFiles  = dirsAndFiles.map(function (filename) {
		return path.resolve(filename);
	});


	watch(dirsAndFiles, { recursive: true, followSymLinks: true }, filter(match, update));

	function filter(pattern, fn) {
		return function (evt, filename) {
			if (blackList.indexOf(path.basename(filename.toLowerCase())) === -1) {
				if (pattern.test(filename)) {
					fn.apply(null, arguments);
				}
			}
		}
	}

	function update(ev, files, ext) {
		callback( !_.isArray(files) ? [files] : files );
	}
};
