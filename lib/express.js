var express = require('express');
var path = require('path');

module.exports = function (options, done) {
	options = options || {};
	var assetsPath = options.assetsPath || path.join('build', 'assets');
	var rootPath   = options.rootPath || path.join('build');
	var stylesPath = options.stylesPath || path.join('styles');
	var port       = options.port || process.env.PORT || 5000;
	var urlrewrite = options.urlrewrite || false;
	var app = express();
	var staticOptions = {
		setHeaders: function setHeaders(res, path, stat) {
			res.header('Access-Control-Allow-Credentials', true);
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
			res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization, Content-Type, Agent, App-Build');
			res.header('Timer-Allow-Origin', '*');
		}
	}
	app.use('/assets', express.static(path.resolve(assetsPath), staticOptions));
	app.use('/styles', express.static(path.resolve(stylesPath), staticOptions));
	app.use('/', express.static(path.resolve(rootPath), staticOptions));

	if (urlrewrite) {
		console.log('URL rewrite is enabled'.yellow);
		app.use('/cordova.js', (req, res) => {
			res.status(404).end();
		});
		app.get('*', (req, res, next) => {
			res.sendFile(path.join(path.resolve(rootPath), 'index.html'));
		});
	}

	app.listen(port);
	done(null, port);
};
