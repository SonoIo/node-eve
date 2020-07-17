#!/usr/bin/env node
const _               = require('underscore');
const program         = require('commander');
const colors          = require('colors');
const path            = require('path');
const exec            = require('child_process').exec;
const notify          = require('./notify');
const watch           = require('./watch');
const pkg             = require('../package.json');
const compileL10nsForComponents = require('./compileL10nsForComponents');

program
	.version(pkg.version);

// http://patorjk.com/software/taag/#p=display&f=Slant&t=EVE
const logo = '' +
'    _______    ________\n' +
'   / ____/ |  / / ____/\n' +
'  / __/  | | / / __/   \n' +
' / /___  | |/ / /___   \n' +
'/_____/  |___/_____/ ' + pkg.version + '\n';



console.log(logo.cyan);
console.log('In case of EMFILE error use this command: ulimit -n 2048'.gray);

process.env.building = null;

program
	.command('init [name]')
	.description('Create an app from template.')
	.action(function (name, options) {
		var init = require('./init');
		init(name, function (err) {
			if (err) return handleError(err, 'Init', options.verbose);
			console.log('App '.gray + name.cyan + ' initialized successfully'.gray + '\u0007');
			// console.log('Type `bower install` to download all dependencies then `eve start` to start the app'.gray');
		});
	});

program
	.command('build [type] [unit]')
	.option('-c, --config <config>', 'custom config file')
	.option('-m, --forceminified', 'force the minify after build and jscrambler code')
	.option('-t --translate', 'translate string into source with l10ns')
	.option('-s --nosourcemap', 'disable sourcemap')
	.option('-vv, --verbose', 'verbose mode')
	.description('Compila l\'applicazione')
	.action(function (type, unit, options) {
		const build  = require('./build');
		const scss   = require('./scss');

		compileL10nsForComponents(options,function(err, time){
			if ( err ){
				return handleError(err, 'l10ns', options.verbose);
			}

			build(type, unit, false, options, function (err, time, type) {
				if (err) return handleError(err, 'JS', options.verbose);
				notify.success('JS builded', `Time ${time}`);
				console.log('JS builded with type '.gray + type.cyan + '...'.gray + time.green + '\u0007');
			});
			scss(type, unit, false, options, function (err, time) {
				if (err) return handleError(err, 'SCSS', options.verbose);
				notify.success('Scss builded', `Time ${time}`);
				console.log('SCSS builded...'.gray + time.green + '\u0007');
			});

		});

	});

program
	.command('start')
	.description('Start a web server and watchify for developer\'s directory for build the application.')
	.option('-p --port <port>', 'Port')
	.option('-a --app [platform]', 'App platform')
	.option('-c --config <config>', 'custom config file')
	.option('-t --translate', 'translate string into source with l10ns')
	.option('-r --urlrewrite', 'urlrewrite every request to index.html')
	.option('-s --nosourcemap', 'disable sourcemap')
	.option('-vv --verbose', 'verbose mode')
	.action(function (options) {
		const build   = require('./build');
		const scss    = require('./scss');
		const express = require('./express');
		const notify = require('./notify');

		express(options, function (err, port) {
			console.log('Server started at port '.grey + (port + '').cyan);
		});

		// Pre-compile the project and components for translation
		compileL10nsForComponents(options, function(err, time){
			if ( err ){
				return handleError(err, 'l10ns', options.verbose);
			}

			build('dev', null, true, options, function (err, time, type) {
				if (err) return handleError(err, 'JS', options.verbose);
				prepareApp(function(err, platform) {
					if (err) return handleError(err, 'CORDOVA', options.verbose);

					notify.success('Javascript builded', `Time ${time}`);
					console.log('JS builded...'.gray + time.green + '\u0007');

					if (platform)
						console.log('  Cordova prepared...'.gray + platform.green);
				});
			});

			scss('dev', null, true, options, function (err, time) {
				if (err) return handleError(err, 'SCSS', options.verbose);
				prepareApp(function(err, platform) {
					if (err) return handleError(err, 'CORDOVA', options.verbose);

					notify.success('Scss builded', `Time ${time}`);
					console.log('SCSS builded...'.gray + time.green + '\u0007');

					if (platform)
						console.log('  Cordova prepared...'.gray + platform.green);
				});
			});

		});


		function prepareApp(done) {
			if (!options.app) return done(null, false);
			var command = 'cordova prepare';
			var params = {
				cwd: path.join(process.cwd(), 'app'),
			};
			if (options.app !== true)
				command += ' ' + options.app;
			exec('cordova prepare', params, function(err) {
				done(err, options.app === true ? 'all' : options.app);
			});
		}
	});

program
	.command('test <unit>')
	.description('Testing mode')
	.option('-c --config <config>', 'custom config file')
	.option('-p --port <port>', 'Port', 5001)
	.option('-t --translate', 'translate string into source with l10ns')
	.action(function (unit, options) {
		const build   = require('./build');
		const scss    = require('./scss');
		const express = require('./express');
		const notify = require('./notify');

		options.rootPath = path.join('test', unit);

		express(options, function (err, port) {
			console.log('Test server started at port '.grey + (port + '').cyan + ' for '.grey + unit.cyan + ' unit'.grey);
		});

		compileL10nsForComponents(options, function(err, time){
			if ( err ){
				return handleError(err, 'l10ns', options.verbose);
			}

			build('test', unit, true, options, function (err, time, type) {
				if (err) return handleError(err, 'JS', options.verbose);
				notify.success('JS builded', `Time ${time}`);
				console.log('JS builded...'.gray + time.green + '\u0007');
			});

			scss('test', unit, true, options, function (err, time) {
				if (err) return handleError(err, 'SCSS', options.verbose);
				notify.success('Scss builded', `Time ${time}`);
				console.log('SCSS builded...'.gray + time.green + '\u0007');
			});

		});

	});

program
	.command('l10ns <cmd>')
	.description('Alias of l10ns. For more information see https://www.npmjs.com/package/l10ns')
	.option('-l, --lang <language>', 'specify language')
	.option('--port <port>', 'specify port for interface')
	.option('-e, --empty', 'only empty localizations')
	.option('-o, --open', 'open interface in browser')
	.option('-p, --project <project>', 'specify project')
	.option('-h, --help', 'output usage information')
	.action(runL10ns);

program
	.command('translate <cmd>')
	.description('Alias of l10ns. For more information see https://www.npmjs.com/package/l10ns')
	.option('-l, --lang <language>', 'specify language')
	.option('--port <port>', 'specify port for interface')
	.option('-e, --empty', 'only empty localizations')
	.option('-o, --open', 'open interface in browser')
	.option('-p, --project <project>', 'specify project')
	.option('-h, --help', 'output usage information')
	.action(runL10ns);

program.parse(process.argv);

if (!program.args.length) {
	program.help();
}

function runL10ns(cmd, options){
	const l10ns = require('./l10ns');
	l10ns(cmd, options, function(err, time){
		if (err) return handleError(err, 'l10ns');
		let msg = `l10ns ${cmd == 'watch' ? 'compiled' : cmd }`;
		// notify.success(msg, `Time ${time}`);
		console.log(`${msg}...`.gray + time.green  ); // + '\u0007'
	});
}

function handleError(err, title, verbose) {
	if (title) {
		title = `${title} error`;
		console.error(title.red);
	}
	var output = '|   '.red + err.toString().replace(/\n/g, '\n' + '|   '.red);

	let filename;
	let line;
	if ( _.isObject(err)){
		filename = err.filename;
		line     = err.loc && err.loc ? err.loc.line : null;
		column   = err.loc && err.loc ? err.loc.column : null;
	}

	notify.error(
		title||'Error on build',
	 	err.toString(),
		{
			filename: filename,
			line: line,
			column: column
		}
	);
	if (verbose) {
		console.log(err);
	}
	console.error(output);
	console.error('');
}


function split(str){
	return str.split(",");
}
