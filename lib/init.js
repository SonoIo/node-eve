var fs      = require('fs');
var path    = require('path');
var copyDir = require('extended-fs').copyDir;

module.exports = function (name, done) {
	var src  = path.join(__dirname, '../resources/app-template');
	var dest = path.join(process.cwd(), name);
	// console.log(src);
	// console.log(dest);
	// console.log(name);
	copyDir(src, dest, function (err) {
		if (err) return done(err);
		// Sotituisce le variabili nei file appena copiati
		var vars = {
			APP_NAME: name
		};
		writeVarsSync(vars, path.join(dest, 'package.json'));
		writeVarsSync(vars, path.join(dest, 'bower.json'));
		writeVarsSync(vars, path.join(dest, 'build/index.html'));
		done();
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
