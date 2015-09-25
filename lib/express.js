var express = require('express');
var path = require('path');

module.exports = function (options, done) {	
	options = options || {};
	var assetsPath = options.assetsPath || path.join('build', 'assets');
	var rootPath   = options.rootPath || path.join('build');
	var stylesPath = options.stylesPath || path.join('styles');
	var port       = options.port || process.env.PORT || 5000;
	var app = express();
	app.use('/assets', express.static(path.resolve(assetsPath)));
	app.use('/styles', express.static(path.resolve(stylesPath)));
	app.use('/', express.static(path.resolve(rootPath)));
	app.listen(port);
	done(null, port);
};


