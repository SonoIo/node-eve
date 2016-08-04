#!/usr/bin/env node

var program = require('commander');
var colors  = require('colors');
var path    = require('path');
var pkg     = require('../package.json');
var exec    = require('child_process').exec;
var ets     = require('ets');

program
	.version(pkg.version);

// http://patorjk.com/software/taag/#p=display&f=Slant&t=EVE
var logo = '' +
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
			if (err) return handleError(err, 'Init');
			console.log('App '.gray + name.cyan + ' initialized successfully'.gray + '\u0007');
			// console.log('Type `bower install` to download all dependencies then `eve start` to start the app'.gray');
		});
	});

program
	.command('build [type] [unit]')
	.option('-m --mode <mode>', 'starter,mobile,html5,nodejs')
	.description('Compila l\'applicazione')
	.action(function (type, unit, options) {
		var build = require('./build');
		var scss  = require('./scss');

		build(type, unit, false, options, function (err, time, type) {
			if (err) return handleError(err, 'JS');
			console.log('JS builded with type '.gray + type.cyan + '...'.gray + time.green + '\u0007');
		});
		scss(type, unit, false, function (err, time) {
			if (err) return handleError(err, 'SCSS');
			console.log('SCSS builded...'.gray + time.green + '\u0007');
		});
	});

program
	.command('start')
	.description('Start a web server and watchify for developer\'s directory for build the application.')
	.option('-p --port <port>', 'Port')
	.option('-a --app [platform]', 'App platform')
	.action(function (options) {
		var build   = require('./build');
		var scss    = require('./scss');
		var express = require('./express');

		express(options, function (err, port) {
			console.log('Server started at port '.grey + (port + '').cyan);
		});

		build('dev', null, true, function (err, time, type) {
			if (err) return handleError(err, 'JS');
			prepareApp(function(err, platform) {
				if (err) return handleError(err, 'CORDOVA');
				console.log('JS builded...'.gray + time.green + '\u0007');
				if (platform)
					console.log('  Cordova prepared...'.gray + platform.green);
			});
		});

		scss('dev', null, true, function (err, time) {
			if (err) return handleError(err, 'SCSS');
			prepareApp(function(err, platform) {
				if (err) return handleError(err, 'CORDOVA');
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
	.option('-p --port <port>', 'Port', 5001)
	.action(function (unit, options) {
		var watch   = require('./watch');
		var build   = require('./build');
		var scss    = require('./scss');
		var express = require('./express');
		options.rootPath = path.join('test', unit);

		express(options, function (err, port) {
			console.log('Test server started at port '.grey + (port + '').cyan + ' for '.grey + unit.cyan + ' unit'.grey);
		});

		watch(function (isJs, isCss) {
			var loading;
			if (isJs) {
				build('test', unit, true, function (err, time, type) {
					clearInterval(loading);
					process.stdout.clearLine();
					process.stdout.cursorTo(0);
					if (err) return handleError(err, 'JS');
					console.log('JS builded...'.gray + time.green + '\u0007');
				});
			}
			if (isCss) {
				scss('test', unit, true, function (err, time) {
					clearInterval(loading);
					process.stdout.clearLine();
					process.stdout.cursorTo(0);
					if (err) return handleError(err, 'SCSS');
					console.log('SCSS builded...'.gray + time.green + '\u0007');
				});
			}
			if (isJs || isCss) {
				process.stdout.write('Building.');
				loading = setInterval(function() {
					process.stdout.write('.');
				}, 1000);
			}
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


function handleError(err, title) {
	if (title) {
		console.error(title.red + ' error'.red);
	}
	var output = '|   '.red + err.toString().replace(/\n/g, '\n' + '|   '.red);
	console.error(output);
	console.error('');
}


function split(str){
	return str.split(",");
}
