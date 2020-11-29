const _            = require( 'underscore' );
const sass         = require('node-sass');
const path         = require('path');
const fs           = require('fs');
const watch        = require('./watch');
const beautifyTime = require('./beautifyTime');

module.exports = function (mode, unit, watcher, options, done) {

	mode = mode || 'dev';

	const packageJSONFile = path.resolve('package.json')
	const pkg             = require(packageJSONFile);
	const namePkg         = pkg['name'];
	const watchifyConfig  = pkg['eve-watchify'] || {};
	var outFile         = path.resolve(path.join('build', 'assets', 'css', 'style.css'));
	var mapFile         = path.resolve(path.join('build', 'assets', 'css', 'style.css.map'));

	_.defaults(watchifyConfig, {
		delay: 500,
		directories: []
	});

	if ( mode == 'test' ) {
		outFile = path.join('test', unit, 'style.css');
		mapFile = path.join('test', unit, 'style.css.map');
	}else if ( mode == 'component' ) {
		outFile = path.resolve(path.join('dist', namePkg+'.css'));
	}

	if ( watcher ) {
		const dirs = ['styles'].concat(watchifyConfig.directories);
		watch({ dirsAndFiles: dirs }, _.debounce( buildScss, watchifyConfig.delay ) );
	}

	buildScss();


	function buildScss(files) {

		if ( _.isArray(files) ){
			files.forEach(function (file) {
				console.log("     file change: %s".gray, path.relative( process.cwd(), file ) );
			});
		}

		var sourcemap = options.nosourcemap ? false : mode != 'dist' && mode != 'pub';
		var exorcist = options.exorcist;

		var time = process.hrtime();
		sass.render({
			file: path.resolve(path.join('styles', 'style.scss')),
			sourceMap: sourcemap,
			outFile: outFile,
			outputStyle: mode == 'dist' || mode == 'pub' ? 'compressed' : null
		}, function(err, result){
			if (err) {
				err.toString = function () {
					var out = '';
					out += 'line ' + this.line + ', column ' + this.column + ' \n';
					out += this.message
					return out;
				};
				return done(err);
			}

			fs.writeFile(outFile, result.css, function (err) {
				if (err) return done(err);
				if (!sourcemap) return done(null, beautifyTime(process.hrtime(time)));
				if (exorcist) {
					// iOS
					fs.writeFile(mapFile, result.map, function (err) {
						if (err) return done(err);
						return done(null, beautifyTime(process.hrtime(time)));
					});
				} else {
					// Android
					fs.appendFile(outFile, result.map, function (err) {
						if (err) return done(err);
						return done(null, beautifyTime(process.hrtime(time)));
					});
				}
			});

		});
	}

};
