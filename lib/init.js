const fs        = require('fs');
const path      = require('path');
const copyDir   = require('extended-fs').copyDir;
const spawn     = require('child_process').spawn;
const waterfall = require('async').waterfall;
const colors    = require('colors');


module.exports = function (name, done) {
	var src  = path.join(__dirname, '../resources/app-template');
	var dest = path.join(process.cwd(), name);


	waterfall([
		function(next){
			console.log("  initialize app %s...".grey, name );
			copyDir(src, dest, function (err) {
				if (err) return next(err);
				// Sotituisce le variabili nei file appena copiati
				var vars = {
					APP_NAME: name
				};
				writeVarsSync(vars, path.join(dest, 'package.json'));
				writeVarsSync(vars, path.join(dest, 'bower.json'));
				writeVarsSync(vars, path.join(dest, 'build/index.html'));
				writeVarsSync(vars, path.join(dest, 'l10ns.json'));
				return next();
			});
		},
		function(next){
			console.log("  move on the project directory and type".grey);
			console.log("    npm install".cyan);
			console.log("    bower install".cyan);
			console.log("  before run the project set the languages in l10ns.json and set the DEFAULT_LANGUAGE in config-*.json then".grey);
			console.log("    npm run translate-update".cyan);
			console.log("    npm run translate-compile".cyan);
			console.log("  then start the project with".grey);
			console.log("    npm start".cyan);
			return next();
			console.log("  install node components...".grey);

			const npm = spawn('npm', ['install'], {cwd: path.resolve(name) });
			// npm.stdout.on('data', (data) => {
			//   console.log(`stdout: ${data}`);
			// });

			npm.stderr.on('data', (data) => {
				return next(data.toString());
			});

			npm.on('close', (code) => {
				return next();
			});

		},
		function(next){
			return next();
			console.log("  install bower components...".grey);

			const bower = spawn('bower', ['install'], {cwd: path.resolve(name) });
			// bower.stdout.on('data', (data) => {
			//   console.log(`stdout: ${data}`);
			// });

			bower.stderr.on('data', (data) => {
				return next(data.toString());
			});

			bower.on('close', (code) => {
				return next();
			});
		}
	], function(err){
		return done(err);
	});

};

function writeVarsSync (vars, file) {
	var content = fs.readFileSync(file);
	content = content.toString();
	Object.keys(vars).forEach(function (aVarName) {
		var re = new RegExp('{{' + aVarName + '}}', 'g');
		content = content.replace(re, vars[aVarName]);
	});
	fs.writeFileSync(file, content);
};
