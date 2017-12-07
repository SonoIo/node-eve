const _     = require( 'underscore' );
const path  = require('path');
const fs    = require('fs');
const spawn = require('child_process').spawn;
const watch = require('./watch');
const beautifyTime = require('./beautifyTime');


module.exports = function runL10ns(cmd, options, done) {
	var l10nsBin = `${path.resolve( __dirname, '..', 'node_modules', '.bin', 'l10ns')}`;
	try{
		// TEST 1 global:  __dirname + ../node_modules/.bin/l10ns
		const d = fs.openSync(l10nsBin, 'r+');
		fs.closeSync(d);
	}catch(e){
		// TEST 2 local:  process.cwd() + /node_modules/.bin/l10ns
		l10nsBin = `${path.resolve( process.cwd(), 'node_modules', '.bin', 'l10ns')}`;
		try{
			const d = fs.openSync(l10nsBin, 'r+');
			fs.closeSync(d);
		}catch(e){
			return done( new Error(`The binary l10ns not found`) );
		}
	}

	const l10nsOptions = {
		cwd: path.join(process.cwd()),
		stdio: [process.stdin, process.stdout, process.stderr],
		shell: true
	};

	console.log(`Command l10ns ${cmd}...`.gray);
	if ( cmd == "watch"){

		watch({ dirsAndFiles: ['lib', 'templates'] }, _.debounce( compileL10ns,  500 ) );
		compileL10ns();

		function compileL10ns(files){
			var time = process.hrtime();
			if ( _.isArray(files) ){
				files.forEach(function(file){
					console.log("     extract string for translating into %s".gray, path.relative( process.cwd(), file ) );
				});
			}

			var time = process.hrtime();
			var p    = spawn(l10nsBin, [ 'update' ], l10nsOptions);

			p.on('close', (code) => {
				p = spawn(l10nsBin, [ 'compile' ], l10nsOptions);
				p.on('close', (code) => {
					return done(null, beautifyTime(process.hrtime(time)));
				});
			});
		}

	}else{
		var opt = [ cmd ];
		if ( options.port){
			opt.push('--port');
			opt.push(options.port);
		}
		if ( options.lang){
			opt.push('--lang');
			opt.push(options.lang);
		}
		if ( options.empty){
			opt.push('--empty');
			opt.push(options.empty);
		}
		if ( options.open){
			opt.push('--open');
			opt.push(options.open);
		}

		var time = process.hrtime();
		var p    = spawn(l10nsBin, opt, l10nsOptions);

		p.on('close', (code) => {
			return done(null, beautifyTime(process.hrtime(time)));
		});
	}

}
