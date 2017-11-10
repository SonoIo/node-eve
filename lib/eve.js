#!/usr/bin/env node
const _        = require('underscore');
const program  = require('commander');
const colors   = require('colors');
const path     = require('path');
const pkg      = require('../package.json');
const exec     = require('child_process').exec;
const ets      = require('ets');
const notify   = require('./notify');


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
	.option('-vv, --verbose', 'verbose mode')
	.description('Compila l\'applicazione')
	.action(function (type, unit, options) {
		const build  = require('./build');
		const scss   = require('./scss');

		build(type, unit, false, options, function (err, time, type) {
			if (err) return handleError(err, 'JS', options.verbose);
			notify.success('JS builded', `Time ${time}`);
			console.log('JS builded with type '.gray + type.cyan + '...'.gray + time.green + '\u0007');
		});
		scss(type, unit, false, function (err, time) {
			if (err) return handleError(err, 'SCSS', options.verbose);
			notify.success('Scss builded', `Time ${time}`);
			console.log('SCSS builded...'.gray + time.green + '\u0007');
		});
	});

program
	.command('start')
	.description('Start a web server and watchify for developer\'s directory for build the application.')
	.option('-p --port <port>', 'Port')
	.option('-a --app [platform]', 'App platform')
	.option('-c --config <config>', 'custom config file')
	.option('-vv --verbose', 'verbose mode')
	.action(function (options) {
		const build   = require('./build');
		const scss    = require('./scss');
		const express = require('./express');
		const notify = require('./notify');

		express(options, function (err, port) {
			console.log('Server started at port '.grey + (port + '').cyan);
		});

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

		scss('dev', null, true, function (err, time) {
			if (err) return handleError(err, 'SCSS', options.verbose);
			prepareApp(function(err, platform) {
				if (err) return handleError(err, 'CORDOVA', options.verbose);

				notify.success('Scss builded', `Time ${time}`);
				console.log('SCSS builded...'.gray + time.green + '\u0007');

				if (platform)
					console.log('  Cordova prepared...'.gray + platform.green);
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
	.action(function (unit, options) {
		const build   = require('./build');
		const scss    = require('./scss');
		const express = require('./express');
		const notify = require('./notify');

		options.rootPath = path.join('test', unit);

		express(options, function (err, port) {
			console.log('Test server started at port '.grey + (port + '').cyan + ' for '.grey + unit.cyan + ' unit'.grey);
		});

		build('test', unit, true, function (err, time, type) {
			if (err) return handleError(err, 'JS', options.verbose);
			notify.success('JS builded', `Time ${time}`);
			console.log('JS builded...'.gray + time.green + '\u0007');
		});

		scss('test', unit, true, function (err, time) {
			if (err) return handleError(err, 'SCSS', options.verbose);
			notify.success('Scss builded', `Time ${time}`);
			console.log('SCSS builded...'.gray + time.green + '\u0007');
		});

	});

program
	.command('extract')
	.description('Extract strings from the application and returns them in a file for translation')
	.option('-d, --dir <directory, directory, ...>', 'Directories', split)
	.option('-o, --out <file>', 'Output file')
	.action(function (options) {
		console.log('\n\nPer avere più funzionalità installare:\n\n    npm install ets -g\n'.cyan);
		ets.extract(options);
	});

program.parse(process.argv);

if (!program.args.length) {
	program.help();
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
