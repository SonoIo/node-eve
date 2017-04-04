const _            = require('underscore');
const { classify } = require('underscore.string');
const colors       = require('colors');
const exorcist     = require('exorcist')
const browserify   = require('browserify');
const watchify     = require('watchify');
const fs           = require('fs');
const path         = require('path');
const UglifyJS     = require('uglify-js');
const jScrambler   = require('jscrambler');
const unzip        = require('unzip');
const es2015       = require.resolve('babel-preset-es2015');
const bowerrcFile  = path.resolve('.bowerrc');
const factor       = require('factor-bundle');

var bowerrc     = { "directory": "bower_components" };
if ( fs.existsSync( bowerrcFile ) ){
	try{
		bowerrc = JSON.parse(fs.readFileSync(bowerrc, 'utf8'));
	}catch(e){}
}

module.exports = function(type, unit, watcher, options, done) {
	if ( _.isFunction(options) ){
		done    = options;
		options = {};
	}

	type = type || 'dev     ';

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
	var mapFiles                 = [];

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
		debug: debug,
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

			console.log( mapFileName );
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

	const pkgDeps                = pkg["dependencies"];
	const bowerDeps              = bower["dependencies"];
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
	bundle();

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
					// Minify
					var src       = fs.readFileSync( outputJsFile, { encoding: 'utf8'} );
					var srcMinify = UglifyJS.minify( src, { fromString: true });

					if ( srcMinify ) {
						fs.writeFileSync(outputJsFile, srcMinify.code);

						if ( isForPublish )
							publisher(outputJsFile, mode, done);

					} else {
						done(new Error('Minify error bundle.js'));
					}

					// Minify commons components
					src       = fs.readFileSync( outputCommonsJsFile, { encoding: 'utf8'} );
					srcMinify = UglifyJS.minify( src, { fromString: true });

					if ( srcMinify ) {
						fs.writeFileSync(outputCommonsJsFile, srcMinify.code);
					} else {
						done(new Error('Minify error commons.bundle.js'));
					}

					for (var i = 0; i < mapFiles.length; i++) {
						fs.unlinkSync(mapFiles[i]);
					}



				}, 2000);

			}
		})
		.pipe(exorcist(outputCommonsJsFile+'.map'))
		.pipe(fs.createWriteStream( outputCommonsJsFile , 'utf8'));
		// .pipe(fs.createWriteStream(outputJsFile, 'utf8'));

	};


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

	function searchES6IntoComponents(babelifyDir) {
		var componentsDir = path.resolve(bowerrc.directory);
		var directories   = fs.readdirSync( componentsDir, { encoding: 'utf8' });
		_.each(directories, function(dir) {
			var pkgFile = path.resolve( componentsDir, dir, 'package.json' );
			if ( fs.existsSync(pkgFile) ){
				var pkg = require( pkgFile );
				if ( pkg['eve-language'] === 'es6' ){
					babelifyDir.push( path.join(bowerrc.directory, dir)  );
				}
			}
		});
	}

}
