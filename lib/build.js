
var exorcist   = require('exorcist')
var browserify = require('browserify');
var fs         = require('fs');
var path       = require('path');
var UglifyJS   = require('uglify-js');


module.exports = function(mode, unit, done) {
	var time = process.hrtime();
	var pkg = require(path.resolve('package.json'));

	mode = mode || 'dev';
	var components = pkg['eve-components'] || [];
	var entryJsFile; 
	var outputJsFile;
	var mapFile;
	var debug;

	switch (mode) {
		case 'dist':
		case 'dev':
			entryJsFile = path.join('lib', 'app.js');
			outputJsFile = path.join('build', 'assets', 'js', 'bundle.js');
			debug = mode === 'dev';
			break;
		case 'test':
			entryJsFile = path.join('test', unit, 'app.js');
			outputJsFile = path.join('test', unit, 'bundle.js');
			debug = true;
			break;
		default:
			return done(new Error('Unknown mode ' + mode));
	}

	mapFile = outputJsFile + '.map';

	var b = browserify({ debug: debug });
	b.transform('brfs', {
		basedir: path.resolve(__dirname, "node_modules")
	});

	components.forEach(function (aComponent) {
		b.require(path.resolve(aComponent.path), aComponent.options);
	});

	b.require(path.resolve(entryJsFile), { entry: true } );

	b.bundle(function (err, buf) {
		if (err) return done(err);
		done(null, beautifyTime(process.hrtime(time)), mode);
	})
	.on("end", function() {
		if ( !debug ){
			setTimeout(function(){
				var src = fs.readFileSync( outputJsFile, { encoding: 'utf8'} ); // buf.toString('utf8');
				var srcMinify = UglifyJS.minify(
								src, 
								{
									fromString: true
								}
							);

				if ( srcMinify ) {
					fs.writeFileSync(outputJsFile, srcMinify.code );
				} else {
					done(new Error('Minify error'));
				}

				if ( fs.existsSync(mapFile) )
					fs.unlinkSync( mapFile );

			}, 2000);
		}
	})
	.pipe(exorcist(mapFile))
	.pipe(fs.createWriteStream(outputJsFile, 'utf8'));


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


}