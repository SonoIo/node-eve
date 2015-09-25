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
'/_____/  |___/_____/   \n';

console.log(logo.cyan);
console.log('In case of EMFILE error type: ulimit -n 2048'.gray);


program
	.command('build [mode] [unit]')
	.description('Compila l\'applicazione')
	.action(function (mode, unit) {
		var build = require('./build');
		var scss = require('./scss');
		build(mode, unit, function (err, time, mode) {
			if (err) return handleError(err, 'JS');
			console.log('JS builded with mode '.gray + mode.cyan + '...'.gray + time.green + '\u0007');
		});
		scss(mode, function (err, time) {
			if (err) return handleError(err, 'SCSS');
			console.log('SCSS builded...'.gray + time.green + '\u0007');
		});
	});

program
	.command('start')
	.description('Esegue l\'applicazione')
	.option('-p --port <port>', 'Port')
	.option('-a --app [platform]', 'App platform')
	.action(function (options) {
		var watch = require('./watch');
		var build = require('./build');
		var scss = require('./scss');
		var express = require('./express');

		express(options, function (err, port) {
			console.log('Server started at port '.grey + (port + '').cyan);
		});

		watch(function (isJs, isCss) {
			if (isJs) {
				build('dev', null, function (err, time, mode) {
					if (err) return handleError(err, 'JS');
					prepareApp(function(err, platform) {
						if (err) return handleError(err, 'CORDOVA');
						console.log('JS builded...'.gray + time.green + '\u0007');
						if (platform)
							console.log('  Cordova prepared...'.gray + platform.green);
					});
				});
			}
			if (isCss) {
				scss('dev', function (err, time) {
					if (err) return handleError(err, 'SCSS');
					prepareApp(function(err, platform) {
						if (err) return handleError(err, 'CORDOVA');
						console.log('SCSS builded...'.gray + time.green + '\u0007');
						if (platform)
							console.log('  Cordova prepared...'.gray + platform.green);
					});
				});
			}
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
	.description('Testa l\'applicazione')
	.option('-p --port <port>', 'Port', 5001)
	.action(function (unit, options) {
		var watch = require('./watch');
		var build = require('./build');
		var scss = require('./scss');
		var express = require('./express');
		options.rootPath = path.join('test', unit);

		express(options, function (err, port) {
			console.log('Test server started at port '.grey + (port + '').cyan + ' for '.grey + unit.cyan + ' unit'.grey);
		});

		watch(function (isJs, isCss) {
			if (isJs) {
				build('test', unit, function (err, time, mode) {
					if (err) return handleError(err, 'JS');
					console.log('JS builded...'.gray + time.green + '\u0007');
				});
			}
			if (isCss) {
				scss('dev', function (err, time) {
					if (err) return handleError(err, 'SCSS');
					console.log('SCSS builded...'.gray + time.green + '\u0007');
				});
			}
		});
	});

program
	.command('extract')
	.description('Estrae le stringhe dall\'applicazione e le restituisce in un file per la traduzione')
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

