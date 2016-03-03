// Search for eve-components in package.json, the dependencies list installed by bower

var _         = require('underscore');
var fs        = require('fs');
var path      = require('path');
var waterfall = require('async').waterfall;


module.exports = function (done) {
	var bowerrc = path.join( process.cwd(), '.bowerrc' );
	var nameBowerComponentsDirectory = 'bower_components';

	fs.stat( bowerrc, function(err){
		if ( !err ){
			try{
				var bowerrcObj = JSON.parse(fs.readFileSync(bowerrc, 'utf8'));	
				if ( _.isString( bowerrcObj['directory'] ) && !_.isEmpty( bowerrcObj['directory'] ) ){
					nameBowerComponentsDirectory = bowerrcObj['directory'];
				}
			}catch(e){}
		}

		return searchEveComponent(nameBowerComponentsDirectory, function(err){
			return done(err);
		});

	} );

};


function searchEveComponent(nameBowerComponentsDirectory, done){
	var pkjProjectFile = path.join( process.cwd(), 'package.json');
	try{
		var pkjProject = JSON.parse(fs.readFileSync(pkjProjectFile, 'utf8'));
	}catch(e){
		return done(new Error('package.json of project does not found!') );
	}

	if ( !_.isArray(pkjProject['eve-components']) || _.isUndefined(pkjProject['eve-components']) )
		pkjProject['eve-components'] = [];

	var dir = path.join( process.cwd(), nameBowerComponentsDirectory );
	var subActions = [];
	waterfall([
		// 
		function(cb){
			fs.stat( dir, function(err){
				if ( err )
					return cb(err);
				return cb();
			});
		},
		// 
		function(cb){
			var dirs = fs.readdirSync(dir);
			if ( _.isArray(dirs) ){
				_.each(dirs, function(subdir){
					var componentPackage = path.join( dir, subdir, 'package.json' );

					subActions.push(function(subCb){
						fs.stat( componentPackage, function(err){
							if ( err )
								return subCb();

							var pkj;
							try{
								pkj = JSON.parse(fs.readFileSync(componentPackage, 'utf8'));	
							}catch(e){
								pkj = {};
							}

							if ( _.isArray(pkj['eve-components']) ){
								_.each(pkj['eve-components'], function(component){
									if ( _.isObject(component) && _.isString(component.path) && !_.isEmpty(component.path) && _.where(pkjProject['eve-components'], {path: component.path}).length === 0 ){
										pkjProject['eve-components'].push( component );
									}
								});
							}
							return subCb();
						});
					}); // End sub Action

				}); // End each
			}
			return cb();
		},
		// Exec sub actions
		function(cb){
			waterfall(
				subActions,
				function(){
					return cb();
				}
			);
		}

	], function(err){
		if ( err )
			return done(err);

		// Update new package json
		fs.writeFileSync( pkjProjectFile , JSON.stringify(pkjProject, null, 4) );

		return done();
	});

};