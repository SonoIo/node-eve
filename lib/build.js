const _                = require('underscore');
const { classify }     = require('underscore.string');
const colors           = require('colors');
const exorcist         = require('exorcist')
const browserify       = require('browserify');
const watchify         = require('watchify');
const fs               = require('fs');
const path             = require('path');
// const UglifyJS         = require('uglify-js');
const Terser           = require('terser');
const jscrambler       = require('jscrambler').default;
const bowerrcFile      = path.resolve('.bowerrc');
const factor           = require('factor-bundle');
const waterfall        = require('async').waterfall;
const junk             = require('junk');
const optimizeJs       = require('optimize-js');
const babelify         = require('babelify');
const notify           = require('./notify');
const beautifyTime     = require('./beautifyTime');
const l10ns            = require('./l10ns');

// Options uglify
var UGLIFYJS_DEFAULT_OPTIONS = {
	compress: {
		drop_console: true,
		drop_debugger: true,
		//
		dead_code: true,
		conditionals: true,
		comparisons: true,
		booleans: true,
		typeofs: true,
		loops: true,
		inline: true,
		join_vars: true
	}
};

var bowerrc = { "directory": "bower_components" };
try{
	bowerrc = JSON.parse(fs.readFileSync(bowerrcFile, {encoding:'utf8'} ));
}catch(e){}


module.exports = function(type, unit, watcher, options, done) {
	if ( _.isFunction(options) ){
		done    = options;
		options = {};
	}

	type = type || 'dev';

	const packageJSONFile        = path.resolve('package.json');
	const bowerJSONFile          = path.resolve('bower.json');
	const configFile             = path.resolve('config.json');
	const configCustomFile       = options.config;
	const bower                  = require(bowerJSONFile);

	var pkg = require(packageJSONFile);
	if ( !pkg['eve-configs'] )
		pkg['eve-configs'] = {};

	var namePkg                  = pkg['name'];
	var mainFile                 = pkg['main'];
	var configs                  = pkg['eve-configs'];
	var language                 = pkg['eve-language'] || 'js';
	var watchifyConfig           = pkg['eve-watchify'] || {};
	var isForPublish             = false;
	var entryJsFile              = path.join('lib', 'app.js');

	var componentsJSFile         = path.resolve('.components.js');
	var componentsBundleJSFile   = path.resolve('.components.bundle.js');
	var outputJsBaseDir          = path.join('build', 'assets', 'js' );
	var outputJsFile             = path.join(outputJsBaseDir, 'bundle.js');
	var outputCommonsJsFile      = path.join(outputJsBaseDir, 'commons.bundle.js');

	var now                      = new Date();
	var buildDate                = now.getFullYear() + '-' + ("0" + (now.getMonth() + 1).toString() ).slice(-2)+ '-' + ("0" + now.getDate().toString() ).slice(-2);
	var buildDateTime            = now.getFullYear() + '-'
									+ ("0" + (now.getMonth() + 1).toString() ).slice(-2)+ '-'
									+ ("0" + now.getDate().toString() ).slice(-2)+ ' '
									+ ("0" + now.getHours().toString() ).slice(-2)+':'
									+ ("0" + now.getMinutes().toString() ).slice(-2)+':'
									+ ("0" + now.getSeconds().toString() ).slice(-2);
	var mapFiles                 = [ `${outputCommonsJsFile}.map` ];
	var pkgBabelPlugins          = pkg["eve-babel-plugins"];
	var uglifyOptions            = pkg["eve-uglify"] || UGLIFYJS_DEFAULT_OPTIONS;


	// Check if exists configs file
	try{
		configs = JSON.parse(fs.readFileSync(configFile, {encoding: 'utf8'}));
	}catch(e){}

	// Copy base information from package.json
	configs.name        = pkg.name;
	configs.version     = pkg.version;
	configs.description = pkg.description||"";
	configs.author      = pkg.author||"";
	configs.license     = pkg.license||"";

	_.defaults(watchifyConfig, {
		delay: 1500,
		ignoreWatch: [ '*.bundle.js', 'bundle.js', 'styles.css', 'package.json', 'config.json', '**/styles/**', '**/node_modules/**' ],// , '**/localizations/**'
		poll: false
	});

	var debug;
	var babelifyDir = [];

	switch (type) {
		case 'dist':
			debug = false;
			configs.env = 'production';
			break;
		case 'dev':
			debug = true;
			configs.env = 'development';
			break;
		case 'test':
			entryJsFile            = path.join('test', unit, 'app.js');
			outputJsFile           = path.join('test', unit, 'bundle.js');
			outputCommonsJsFile    = path.join('test', unit, 'commons.bundle.js');
			componentsJSFile       = path.join('test', unit, '.components.js');
			componentsBundleJSFile = path.join('test', unit, '.components.bundle.js');

			debug = true;
			configs.env  = 'development';
			if (language === 'es6') {
				babelifyDir.push('test', unit);
			}
			break;
		case 'pub':
			debug = false;
			isForPublish = true;
			configs.env  = 'production';
			break;
		default:
			return done(new Error('Unknown type ' + type));
	}

	// Copy configs file
	var configEnv = {};
	var canReadDefaultConfig = true;
	try{
		try{
			if (!_.isEmpty(configCustomFile)){
				configEnv = JSON.parse( fs.readFileSync(path.resolve(configCustomFile)) );
				canReadDefaultConfig = false;
			}
		}catch(e){
			canReadDefaultConfig = true;
		}

		if ( canReadDefaultConfig )
			configEnv = JSON.parse( fs.readFileSync(path.resolve(`config-${configs.env}.json`)) );

	}catch(e){
		if ( _.isObject( pkg[ "eve-configs-" + configs.env ] ) )
			configEnv = pkg[ "eve-configs-" + configs.env ];
	}

	// Extend config genera with config for enviroment
	_.extend(configs, configEnv);

	configs['build-date']      = buildDate;
	configs['build-date-time'] = buildDateTime;

	// Update new package json
	fs.writeFileSync(configFile , JSON.stringify(configs, null, 4));
	// fs.writeFileSync(path.join(path.dirname(configFile), 'config.js') , `export default ${JSON.stringify(configs, null, 4)};`);


	var b = browserify({
		debug: options.nosourcemap ? false : debug,
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
			if (options.exorcist) {
				pipeline.get('wrap').push( exorcist(mapFileName) );
			}
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
		if ( mainFile ){
			// Check file exist
			try{
				var mainFilePath = path.resolve(mainFile);
				var fd = fs.openSync( mainFilePath, 'r+' );
				fs.closeSync(fd);
				babelifyDir.push(mainFilePath);
			}catch(e){
				// Nothing
			}
		}
	}

	// Research into the components folder if there are ES6 files to compile
	searchES6IntoComponents(babelifyDir);

	let babelPlugins = [
		[ require.resolve('@babel/plugin-transform-runtime'), { absoluteRuntime: path.resolve(__dirname, 'node_modules') }],
		require.resolve('@babel/plugin-proposal-export-default-from'),
		require.resolve('@babel/plugin-proposal-export-namespace-from'),
		require.resolve('@babel/plugin-proposal-class-properties'),
		require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
		require.resolve('@babel/plugin-proposal-optional-chaining'),
		require.resolve('@babel/plugin-proposal-object-rest-spread'),
		require.resolve('babel-plugin-inline-json-import')
	];

	if (babelifyDir.length > 0) {
		b.transform('babelify', {
			basedir: path.resolve(__dirname, 'node_modules'),
			presets: [ require.resolve('@babel/preset-env') ], // @ref: https://github.com/babel/babel-loader/issues/149#issuecomment-191991686
			plugins: babelPlugins,
			sourceMapsAbsolute: true,
			// only: babelifyOnly
		});
	}

	b.transform('debowerify', {
		basedir: path.resolve(__dirname, "node_modules")
	});

	b.transform('browserify-shim', {
		basedir: path.resolve(__dirname, "node_modules")
	});

	b.transform('node-underscorify', {
		basedir: path.resolve(__dirname, "node_modules")
	});

	const pkgDeps   = pkg["dependencies"];
	const bowerDeps = bower["dependencies"];
	var text = '';

	if (_.isObject(bowerDeps)) {
		_(bowerDeps).each(function(component, name) {
			text += `const ${classify(name)} = require('${name}');\n`;
		});
	}
	if (_.isObject(pkgDeps)) {
		_(pkgDeps).each(function(component, name) {
			text += `const ${classify(name)} = require('${name}');\n`;
		});
	}

	// Write file
	fs.writeFileSync(componentsJSFile, text, {encoding: 'utf8'});

	// Entry files
	b.require([path.resolve(entryJsFile), componentsJSFile], { entry: true });

	// Plugin Factor bundle. Split in tow bundles
	b.plugin(factor, { outputs: [ outputJsFile, componentsBundleJSFile ] });


	// Run bundle
	return bundle();


	function bundle(files) {

		if ( _.isArray(files) ){
			if ( files.length == 1 && files[0].indexOf('localizations') > -1 ) {
				return;
			}
			files.forEach(function (file) {
				console.log("     file change: %s".gray, path.relative( process.cwd(), file ) );
			});
		}

		waterfall([
			// Translate: update strings from source
			function(next){
				if ( !options.translate )
					return next();
				l10ns('update',  function(){
					return next();
				});
			},
			// Translate: compile strings for translate
			function(next){
				if ( !options.translate )
					return next();
				l10ns('compile',  function(err, time){
					console.log("     l10ns compiled...".gray + time.green );
					return next();
				});
			},
			// Build
			function(next){
				var time = process.hrtime();
				var bundler = b.bundle(function (err, buf) {
					if (err) return done(err);
					done(null, beautifyTime( process.hrtime(time) ), type);
				})
				.on("end", function() {
					next(); // End waterfall

					if (!debug) {
						setTimeout(function() {

							waterfall([
								// Minify commons components
								function (next) {
									minify(
										outputCommonsJsFile,
										_.extend({optimize: true},uglifyOptions),
										function(err){
											if ( err ){
												return next(err);
											}
											return next();
										}
									);

								},
								// Minify bundle app
								function (next) {

									minify(
										outputJsFile,
										_.extend({optimize: true},uglifyOptions),
										function(err){
											if ( err ){
												return next(err);
											}

											if ( isForPublish ){
												publisher(
													outputJsFile,
													function (err) {
														return next(err);
													},
													options.forceminified
												);
											}else {
												return next();
											}

										}
									);

								},
								// Remove source map files
								function (next) {
									for (var i = 0; i < mapFiles.length; i++) {
										try {
											fs.unlinkSync(mapFiles[i]);
										} catch(e) {}
										// console.log( path.resolve(mapFiles[i]) );
									}
									return next();
								}

							], function (err) {
								if ( err ){
									if ( _.isObject(err) && err.message ){
										notify.error('JS error build', err.message);
										console.log(err.message.red);
									}else {
										notify.error('JS error build', err.toString());
										console.log(err.toString().red);
									}
									return false;
								}
								console.log('Application builded!'.green);
							});

						}, 2000);

					}
				})

				if (options.exorcist) {
					bundler.pipe(exorcist(outputCommonsJsFile+'.map'))
				}
				bundler.pipe(fs.createWriteStream( outputCommonsJsFile , 'utf8'));
				// bundler.pipe(fs.createWriteStream(outputJsFile, 'utf8'));
			}
		], function(){
			// nothing
		});

	}; // End bundle


	// Function for minified
	async function minify( file, options, done ){
		if (_.isFunction(options)){
			done = options;
			options = {};
		}
		if (!_.isObject(options))
			options = {};
		if (!_.isFunction(done))
			done = function(){};

		const canOptimize = options.optimize;
		delete options.optimize;

		console.log("  minify file %s...".grey, file);
		try {
			var code   = fs.readFileSync( file, {encoding: 'utf8'} );
			var minify = await Terser.minify( code, options );
		} catch (e) {
			return done(  new Error(`Error on parse file ${e.filename}`) );
		}

		if ( !minify || minify.error ) {
			if ( minify && minify.error )
				return done( new Error(minify.error.message) );
			return done(new Error('Minify error bundle.js') );
		}

		try{
			if ( canOptimize ){
				console.log("  optimize file %s...".grey, file );
				code = optimizeJs(minify.code);
			}else{
				code = minify.code;
			}
		}catch(e){
			console.error("Error on parse file %s", e.filename);
			return next(e);
		}

		fs.writeFile(
			file,
			code,
			function (err) {
				if ( err )
					return done(err);


				return done();
			}
		);
	}


	// Function for publisher and obfuscation method
	function publisher(outputJsFile, done, forceMinified){
		// Check if JSCrambler configs file exist
		const time = process.hrtime();
		const jscramblerConfigs = path.resolve('jscrambler.json');
		fs.stat( jscramblerConfigs, function (err) {
			if ( err ){
				let newTime =
				console.log('  obfuscating code with jScrambler was not executed, because the configs file `jscrambler.json` is not present into project\'s directory.'.yellow);
				console.log('Publication finished!'.gray); // +beautifyTime( process.hrtime(time) ).green + '\u0007'
				return done(err);
			}

			console.log('  obfuscating code with jScrambler...'.gray);
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

					if ( !forceMinified ){
						console.log('Publication finished in '.gray+beautifyTime( process.hrtime(time) ).green + '\u0007');
						return done();
					}

					minify(outputJsFile,{},function(err){
						if (err){
							return done(err);
						}
						console.log('Publication finished in '.gray+beautifyTime( process.hrtime(time) ).green + '\u0007');
						return done();
					});


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
		directories.forEach(function(dir) {
			var subDir  = path.resolve( componentsDir, dir);
			var pkgFile = path.join( subDir, 'package.json' );
			try {
				var stat = fs.lstatSync(subDir);
				var isSymlink = stat.isSymbolicLink();
				if (fs.statSync(pkgFile) ){
					var pkg = require( pkgFile );
					if ( pkg['eve-language'] === 'es6' ){
						// babelifyDir.push(path.join(bowerrc.directory, dir));
						babelifyDir.push({
							dir: path.join(bowerrc.directory, dir),
							isSymlink: isSymlink,
							realPath: fs.realpathSync(path.join(bowerrc.directory, dir))
						});
					}
				}
			} catch(e) {}

		});
	}

}
