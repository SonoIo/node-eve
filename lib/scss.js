var _     = require( 'underscore' );
var sass  = require('node-sass');
var path  = require('path');
var fs    = require('fs');
var watch = require('./watch');

module.exports = function (mode, unit, watcher, done) {

	mode = mode || 'dev';

	var packageJSONFile = path.resolve('package.json')
	var pkg             = require(packageJSONFile);
	var namePkg         = pkg['name'];
	var watchifyConfig  = pkg['eve-watchify'] || {};
	var outFile         = path.resolve(path.join('build', 'assets', 'css', 'style.css'));
	var mapFile         = path.resolve(path.join('build', 'assets', 'css', 'style.css.map'));

	_.defaults(watchifyConfig, {
		delay: 500
	});

	if ( mode == 'test' ) {
		outFile = path.join('test', unit, 'style.css');
		mapFile = path.join('test', unit, 'style.css.map');
	}else if ( mode == 'component' ) {
		outFile = path.resolve(path.join('dist', namePkg+'.css'));
	}

	if ( watcher )
		watch({ dirsAndFiles: ['styles'] }, _.debounce( buildScss, watchifyConfig.delay ) );

	buildScss();


	function buildScss(files) {

		if ( _.isArray(files) ){
			files.forEach(function (file) {
				console.log("     file change: %s".gray, path.relative( process.cwd(), file ) );
			});
		}

		var time = process.hrtime();
		sass.render({
			file: path.resolve(path.join('styles', 'style.scss')),
			sourceMap: mode != 'dist',
			outFile: outFile,
			outputStyle: mode == 'dist' ? 'compressed' : null
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
				if ( mode == 'dist' ){
					try{
						fs.unlinkSync(mapFile);
					}catch(e){}
					return done(null, beautifyTime(process.hrtime(time)));
				}
				fs.writeFile(mapFile, result.map, function (err) {
					if (err) return done(err);
					return done(null, beautifyTime(process.hrtime(time)));
				});
			});

		});
	}

	function beautifyTime(diff) {
		var out = '';
		if (diff[0] > 0) {
			out += diff[0];
			out += '.';
			out += parseInt( diff[1] / 1e6 ) + 's'
		}
		else {
			out += parseInt( diff[1] / 1e6 ) + 'ms'
		}
		return out;
	};

};
