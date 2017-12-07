const _           = require('underscore');
const fs          = require('fs');
const path        = require('path');
const junk        = require('junk');
const {waterfall} = require('async');
const beautifyTime = require('./beautifyTime');

// l10ns Translate
global.program  = require('l10ns/configurations/program');
global.commands = { project: "" };

const l10ns       = require('l10ns/libraries');
const bowerrcFile = path.resolve('.bowerrc');

let bowerrc = { "directory": "bower_components" };
try{
	bowerrc = JSON.parse(fs.readFileSync(bowerrcFile, {encoding:'utf8'} ));
}catch(e){}

/**
 * Compile the l10ns translation for components
 */
module.exports = function compileL10nsForComponents(options, done){
	if ( _.isFunction(options)){
		done = options;
		options = {};
	}
	if (!_.isFunction(done)){
		done = function(){};
	}

	const oDone       = done;
	var time          = process.hrtime();

	done = function(err, time){
		if ( options.translate )
			console.log('l10ns components compiled...'.gray + time.green);
		return oDone(err);
	}

	if ( !options.translate )
		return done(null, beautifyTime(process.hrtime(time)));

	var componentsDir = path.resolve(bowerrc.directory);
	var directories   = fs.readdirSync( componentsDir, { encoding: 'utf8' }).filter(junk.not);
	var cwd           = process.cwd();
	var actions       = [];

	directories.forEach(function(dir) {
		var subDir  = path.resolve( componentsDir, dir);

		// Compile component for l10ns
		// console.log(subDir);
		try{
			const f = fs.readFileSync( path.join(subDir, 'l10ns.json') );

			actions.push(function(next){
				// Change work direcotry
				process.chdir( subDir );

				l10ns.initialize()
					.then(function() {
						return l10ns.compile();
					})
					.then(function(){
						return next();
					})
					.fail(function(error) {
						console.log(error);
						// if(commands.stack && error && error.stack) {
						// 	console.log(error.stack);
						// }
						// if(error && error.message) {
						// 	console.log(error.message);
						// }
						//
						return next( error );
					});
			});

		}catch(e){
		}
	});

	waterfall(
		actions,
		function(err){
			process.chdir( cwd );
			return done(err, beautifyTime(process.hrtime(time)));
		}
	);
}
