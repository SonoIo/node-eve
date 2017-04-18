const _                = require('underscore');
const { classify }     = require('underscore.string');
const colors           = require('colors');
const exorcist         = require('exorcist')
const browserify       = require('browserify');
const watchify         = require('watchify');
const fs               = require('fs');
const path             = require('path');
const UglifyJS         = require('uglify-js');
const jscrambler       = require('jscrambler').default;
const unzip            = require('unzip');
const es2015           = require.resolve('babel-preset-es2015');
const bowerrcFile      = path.resolve('.bowerrc');
const factor           = require('factor-bundle');
const waterfall        = require('async').waterfall;
const junk             = require('junk');
const UGLIFYJS_OPTIONS = {
	compress: {
		screw_ie8: true, // Use this flag if you don't wish to support Internet Explorer 6/7/8.
		drop_console: true,
		drop_debugger: true
	}
};

var bowerrc     = { "directory": "bower_components" };
if ( fs.statSync( bowerrcFile ) ){
	try{
		bowerrc = JSON.parse(fs.readFileSync(bowerrc, 'utf8'));
	}catch(e){}
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


module.exports = function(type, unit, watcher, options, done) {
	if ( _.isFunction(options) ){
		done    = options;
		options = {};
	}

	type = type || 'dev';

	const mode                   = options.mode || 'mobile';
	const packageJSONFile        = path.resolve('package.json');
	const bowerJSONFile          = path.resolve('bower.json');
	const bower                  = require(bowerJSONFile);
	const componentsJSFile       = path.resolve('.components.js');
	const componentsBundleJSFile = path.resolve('.components.bundle.js');

	var pkg = require(packageJSONFile);
	if ( !pkg['eve-configs'] )
		pkg['eve-configs'] = {};

	var namePkg                  = pkg['name'];
	var configs                  = pkg['eve-configs'];
	var language                 = pkg['eve-language'] || 'js';
	var watchifyConfig           = pkg['eve-watchify'] || {};
	var isForPublish             = false;
	var entryJsFile              = path.join('lib', 'app.js');
	var outputJsBaseDir          = path.join('build', 'assets', 'js' );
	var outputJsFile             = path.join(outputJsBaseDir, 'bundle.js');
	var outputCommonsJsFile      = path.join(outputJsBaseDir, 'commons.bundle.js');
	var now                      = new Date();
	var buildDate                = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
	var mapFiles                 = [ `${outputCommonsJsFile}.map` ];

	_.defaults(watchifyConfig, {
		delay: 500,
		ignoreWatch: [ '*.bundle.js', 'bundle.js', 'styles.css', 'package.json', '**/styles/**', '**/node_modules/**' ],
		poll: false
	});

	var debug;
	var babelifyDir = [];

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
			if (language === 'es6') {
				babelifyDir.push('test', unit);
			}
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

	pkg['eve-build-date'] = buildDate;

	// Update new package json
	fs.writeFileSync(packageJSONFile , JSON.stringify(pkg, null, 4));


	var b = browserify({
		debug: true, // debug,
		cache: {},
		packageCache: {}
	});

	// Events
	var mapFileName;
	b.on("factor.pipeline", function(file, pipeline){

		if ( path.basename(file) == 'app.js'  ){
			mapFileName = `${outputJsFile}.map`;
		}else if ( path.basename(file) == '.components.js' ){
			mapFileName = `${componentsBundleJSFile}.map`;
		}else{
			mapFileName = null;
		}

		if ( mapFileName ){
			if ( mapFiles.indexOf(mapFileName) == -1  )
				mapFiles.push( mapFileName );
			pipeline.get('wrap').push( exorcist(mapFileName) );
		}

	});

	// b.on('log', function (msg) {
	// 	console.log(msg.gray);
	// });

	b.on('update', bundle);


	if ( watcher )
		b.plugin( watchify, watchifyConfig );


	// If language is ECMAScript 2015 package adding lib directory to compile width babel
	if (language === 'es6') {
		babelifyDir.push('lib');
	}

	// Research into the components folder if there are ES6 files to compile
	searchES6IntoComponents(babelifyDir);

	if ( babelifyDir.length > 0  ){
		b.transform('babelify', {
			basedir: path.resolve(__dirname, "node_modules"),
			presets: [ es2015 ], // @ref: https://github.com/babel/babel-loader/issues/149#issuecomment-191991686
			sourceMapsAbsolute: true,
			only: babelifyDir
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

	// Make a temp file for shared library. The file name is ".commons.js" and this file not include into bundle.
	// Read bower.json dependencies and package.json dependencies

	const pkgDeps   = pkg["dependencies"];
	const bowerDeps = bower["dependencies"];
	var text = '';

	if ( _.isObject(bowerDeps) ){
		_(bowerDeps).each(function(component, name) {
			text += `const  ${classify(name)} = require('${name}');\n`;
		});
	}
	if ( _.isObject(pkgDeps) ){
		_(pkgDeps).each(function(component, name) {
			text += `const  ${classify(name)} = require('${name}');\n`;
		});
	}

	// Write file
	fs.writeFileSync(componentsJSFile, text, {encoding: 'utf8'});

	// Entry files
	b.require( [path.resolve(entryJsFile), componentsJSFile], { entry: true });

	// Plugin Factor bundle. Split in tow bundles
	b.plugin(factor, { outputs: [ outputJsFile, componentsBundleJSFile ] });


	// Run bundle
	return bundle();

	function bundle(files) {

		if ( _.isArray(files) ){
			files.forEach(function (file) {
				console.log("     file change: %s".gray, path.relative( process.cwd(), file ) );
			});
		}

		var time = process.hrtime();
		b.bundle(function (err, buf) {
			if (err) return done(err);
			done(null, beautifyTime( process.hrtime(time) ), type);
		})
		.on("end", function() {
			if ( !debug ) {
				setTimeout(function() {

					waterfall([
						// Remove source map files
						function (next) {
							for (var i = 0; i < mapFiles.length; i++) {
								fs.unlinkSync(mapFiles[i]);
								// console.log( path.resolve(mapFiles[i]) );
							}
							return next();
						},
						// Minify commons components
						function (next) {

							console.log("  Minify file %s...".grey, outputCommonsJsFile);
							try{
								var minify = UglifyJS.minify( outputCommonsJsFile, UGLIFYJS_OPTIONS );
							}catch(e){
								console.error("Error on parse file %s", e.filename);
								return next(e);
							}

							if ( minify ) {
								fs.writeFile(
									outputCommonsJsFile,
									minify.code,
									function (err) {
										if ( err )
											return next(err);
										return next();
									}
								);
							} else {
								return next(new Error('Minify error commons.bundle.js') );
							}

						},
						// Minify bundle app
						function (next) {

							// https://github.com/mishoo/UglifyJS2#compressor-options
							console.log("  Minify file %s...".grey, outputJsFile);
							try {
								var minify = UglifyJS.minify( outputJsFile,  UGLIFYJS_OPTIONS  );
							} catch (e) {
								console.error("Error on parse file %s", e.filename);
								return next(e);
							}

							if ( minify ) {
								fs.writeFile(
									outputJsFile,
									minify.code,
									function (err) {
										if ( err )
											return done(err);

										if ( isForPublish ){
											publisher(
												outputJsFile,
												function (err) {
													return next(err);
												}
											);
										}else {
											return next();
										}
									}
								);
							} else {
								return next(new Error('Minify error bundle.js') );
							}


						}

					], function (err) {
						if ( err ){
							if ( _.isObject(err) && err.message ){
								console.log(err.message.red);
							}else {
								console.log(err.toString().red);
							}
							return;
						}
						console.log('Application builded!'.green);
					});

				}, 2000);

			}
		})
		.pipe(exorcist(outputCommonsJsFile+'.map'))
		.pipe(fs.createWriteStream( outputCommonsJsFile , 'utf8'));
		// .pipe(fs.createWriteStream(outputJsFile, 'utf8'));

	};


	// Function for publisher and obfuscation method
	function publisher(outputJsFile, done){
		// Check if JSCrambler configs file exist
		const time = process.hrtime();
		const jscramblerConfigs = path.resolve('jscrambler.json');
		fs.stat( jscramblerConfigs, function (err) {
			if ( err ){
				let newTime =
				console.log('  Obfuscating code with jScrambler was not executed, because the configs file `jscrambler.json` is not present into project\'s directory.'.yellow);
				console.log('Publication finished!'.gray); // +beautifyTime( process.hrtime(time) ).green + '\u0007'
				return done();
			}

			console.log('  Obfuscating code with jScrambler...'.gray);
			try {
				var configs = require(jscramblerConfigs);
			} catch (e) {
				return done('    Error on obfuscation! The file configs is not a valid JSON'.red);
			}

			if ( !_.isObject(configs.keys) ||
				_.isEmpty(configs.keys.accessKey) ||
				_.isEmpty(configs.keys.secretKey) ||
				_.isEmpty(configs.applicationId)
			){
				return done( new Error('    Error on obfuscation! Jcrambler\'s configs missed. Ex.: accessKey, secretKey or applicationId.') );
			}


			// Set the file for obfuscation
			if ( !_.isArray(configs.filesSrc) )
				configs.filesSrc = [];

			if ( configs.filesSrc.indexOf(outputJsFile) == -1 )
				configs.filesSrc.push(outputJsFile);

			configs.filesDest = path.dirname( packageJSONFile ); // The project's dirname


			/*
			{
				keys: {
					accessKey: 'YOUR_JSCRAMBLER_ACCESS_KEY',
					secretKey: 'YOUR_JSCRAMBLER_SECRET_KEY'
				},
				host: 'api4.jscrambler.com',
				port: 443,
				applicationId: 'YOUR_APPLICATION_ID',
				filesSrc: [
					'/path/to/src/*.html',
					'/path/to/src/*.js'
				],
				filesDest: '/path/to/destDir/',
				params: {
					stringSplitting: {
						chunk: 1
					}
				}
			}
			*/

			const symbolTable = path.join( configs.filesDest, "symbolTable.json");

			jscrambler
				.protectAndDownload(configs)
				.then(function () {
					try{
						const st = fs.statSync( symbolTable );
						fs.unlinkSync(symbolTable);
					}catch(e){}

					console.log('Publication finished in '.gray+beautifyTime( process.hrtime(time) ).green + '\u0007');

					return done();
				})
				.catch(function (err) {
					let message = '    Error on obfuscation! Error while obfuscating the code with jScrambler';
					if ( err && err.message )
						message = `  Error on obfuscation! jScrambler: ${err.message}`;
					done( new Error(message) );
				});

		});
	}

	function searchES6IntoComponents(babelifyDir) {
		var componentsDir = path.resolve(bowerrc.directory);
		var directories   = fs.readdirSync( componentsDir, { encoding: 'utf8' }).filter(junk.not);
		_.each(directories, function(dir) {
			var pkgFile = path.resolve( componentsDir, dir, 'package.json' );
			try{
				if ( fs.statSync(pkgFile) ){
					var pkg = require( pkgFile );
					if ( pkg['eve-language'] === 'es6' ){
						babelifyDir.push( path.join(bowerrc.directory, dir)  );
					}
				}
			}catch(e){}

		});
	}

}
