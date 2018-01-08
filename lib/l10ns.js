const _     = require( 'underscore' );
const path  = require('path');
const fs    = require('fs');
const spawn = require('child_process').spawn;
const watch = require('./watch');
const beautifyTime = require('./beautifyTime');


module.exports = function l10ns(cmd, options, done){
	if ( _.isFunction(options)){
		done    =  options;
		options = {};
	}
	if ( !_.isFunction(done)){
		done = function(){};
	}

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

	if ( cmd == "watch"){

		watch({ dirsAndFiles: ['lib', 'templates'] }, _.debounce( compileL10ns,  500 ) );
		compileL10ns();

		function compileL10ns(files){
			if ( _.isArray(files) ){
				files.forEach(function(file){
					console.log("     extract string for translating into %s".gray, path.relative( process.cwd(), file ) );
				});
			}

			// Run update translation
			l10ns('update',function(err, time){
				inline();
				// Run compile translation
				l10ns('compile',function(err, time){
					return done(null, time);
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

		// console.log(`rum command l10ns ${cmd}...`.gray);
		var time = process.hrtime();
		var p    = spawn(l10nsBin, opt, l10nsOptions);

		p.on('close', (code) => {
			inline();
			return done(null, beautifyTime(process.hrtime(time)));
		});
	}

}


function inline() {
	var path = require('path');
	var fs = require('fs');

	var l10nsJson = require(path.resolve(process.cwd(), 'l10ns'));
	var keys = Object.keys(l10nsJson.projects);
	var l10nsConfig = l10nsJson.projects[keys[0]];
	var localizationsDir = path.resolve(process.cwd(), l10nsConfig.store);

	Object.keys(l10nsConfig.languages).forEach(processFile);

	function processFile(lang) {
		var filepath = path.join(localizationsDir, lang + '.json');
		var json = JSON.parse(fs.readFileSync(filepath));

		try {
			fs.writeFileSync(filepath, processJSON(json));
		} catch (e) {
			console.error('Failed to process localization file ' + filepath);
			console.error(e.stack);
			process.exit(1);
		}
	}

	function processJSON(json) {
		var lines = json
			.sort(function(a, b) {
				var diff = new Date(b.timestamp) - new Date(a.timestamp);

				return diff || b.key.localeCompare(a.key);
			})
			.map(function(entry, i) {
				return [
					'  ',
					JSON.stringify(entry),
					(i !== json.length - 1 ? ',' : '')
				].join('');
			});

		return ['[', lines.join('\n'), ']'].join('\n');
	}

}
