
var _          = require('underscore');
var exorcist   = require('exorcist')
var browserify = require('browserify');
var fs         = require('fs');
var path       = require('path');
var UglifyJS   = require('uglify-js');
var jScrambler = require('jscrambler');
var colors     = require('colors');
var unzip      = require('unzip');

module.exports = function(type, unit, options, done) {

	if ( _.isFunction(options) ){
		done    = options;
		options = {};
	}

	var time            = process.hrtime();
	var mode            = options.mode || 'mobile';
	var packageJSONFile = path.resolve('package.json')
	var pkg             = require(packageJSONFile);

	if ( !pkg['eve-configs'] )
		pkg['eve-configs'] = {};

	type = type || 'dev';
	var configs      = pkg['eve-configs'];
	var language     = pkg['eve-language'] || 'js';
	var isForPublish = false;
	var entryJsFile  = path.join('lib', 'app.js');
	var outputJsFile = path.join('build', 'assets', 'js', 'bundle.js');

	var mapFile;
	var debug;

	switch (type) {
		case 'dist':
		case 'dev':
			debug = type === 'dev';
			configs.env = debug ? 'development' : 'production';
			break;
		case 'test':
			entryJsFile  = path.join('test', unit, 'app.js');
			outputJsFile = path.join('test', unit, 'bundle.js');
			debug = true;
			configs.env  = 'development';
			break;
		case 'pub':
			isForPublish = true;
			configs.env  = 'production';
			break;
		default:
			return done(new Error('Unknown type ' + type));
	}

	if ( _.isObject( pkg[ "eve-configs-" + configs.env ] ) ) {
		_.extend( pkg[ "eve-configs" ],  pkg[ "eve-configs-" + configs.env ] );
	}

	// Update new package json
	fs.writeFileSync(packageJSONFile , JSON.stringify(pkg, null, 4));

	mapFile = outputJsFile + '.map';

	var b = browserify({ debug: debug });
	if (language === 'es6') {
		b.transform('babelify', {
			basedir: path.resolve(__dirname, "node_modules"),
			presets: ['es2015'],
			sourceMapsAbsolute: true,
			only: ['lib']
		});
	}
	b.transform('browserify-shim', {
		basedir: path.resolve(__dirname, "node_modules")
	});
	b.transform('node-underscorify', {
		basedir: path.resolve(__dirname, "node_modules")
	});
	b.transform('debowerify', {
		basedir: path.resolve(__dirname, "node_modules")
	});

	b.require(path.resolve(entryJsFile), { entry: true });

	b.bundle(function (err, buf) {
		if (err) return done(err);
		done(null, beautifyTime(process.hrtime(time)), type);
	})
	.on("end", function() {
		if ( !debug ) {
			setTimeout(function() {
				var src       = fs.readFileSync( outputJsFile, { encoding: 'utf8'} );
				var srcMinify = UglifyJS.minify( src, { fromString: true });

				if ( srcMinify ) {
					fs.writeFileSync(outputJsFile, srcMinify.code);

					if ( isForPublish )
						publisher(outputJsFile, mode, done);

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


	function publisher(outputJsFile, mode, done){
		setTimeout(function(){

			// jScrambler
			var accessKey = process.env.JSCRAMBLER_ACCESSKEY;
			var secretKey = process.env.JSCRAMBLER_SECRETKEY;
			if ( accessKey && secretKey ){

				console.log('  Obfuscating code with jScrambler...'.gray);
				var time   = process.hrtime();
				var client = new jScrambler.Client({keys: {accessKey: accessKey,secretKey: secretKey}});
				jScrambler
					.uploadCode(client, {
						files: [ outputJsFile ],
						mode: mode,
						remove_comments: '%DEFAULT%',
						rename_local: '%DEFAULT%',
						whitespace: '%DEFAULT%',
						literal_hooking: '20;50',
						self_defending: '%DEFAULT%'
					})
					.then(function (res) {
						return jScrambler.downloadCode(client, res.id);
					})
					.then(function (res) {
						//
						var zipFile = outputJsFile+'.zip';
						fs.writeFileSync(zipFile, res);
						fs.unlinkSync(outputJsFile);

						fs.createReadStream(zipFile)
							.pipe(unzip.Extract({ path: path.join('.') }))
							.on('close', function(){
								fs.unlinkSync(zipFile);
								console.log('  Operation completed in '.gray+beautifyTime(process.hrtime(time)).green);
							});

						return true;
					})
					.catch(function (error) {
						done(new Error(error && error.message ? 'jScrambler... ' + error.message : 'Error while obfuscating the code with jScrambler' ) );
					});
			}
			else {
				done(new Error('Set JSCRAMBLER_ACCESSKEY and JSCRAMBLER_SECRETKEY on your .profile'));
			}

		}, 1000);
	}

}
