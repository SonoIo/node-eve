const path = require('path');
const bowerrcFile = path.resolve('.bowerrc');

const bowerrc = { 'directory': 'bower_components' };
try {
	bowerrc = JSON.parse(fs.readFileSync(bowerrcFile, { encoding: 'utf8' } ));
} catch(e) {}

function searchES6IntoComponents(babelifyDir) {
	var componentsDir = path.resolve(bowerrc.directory);
	var directories   = fs.readdirSync( componentsDir, { encoding: 'utf8' }).filter(junk.not);
	directories.forEach(function(dir) {
		var subDir  = path.resolve( componentsDir, dir);
		var pkgFile = path.join( subDir, 'package.json' );
		try {
			var stat = fs.lstatSync(subDir);
			var isSymlink = stat.isSymbolicLink();
			if (fs.statSync(pkgFile) ){
				var pkg = require( pkgFile );
				if (pkg['eve-language'] === 'es6') {
					// babelifyDir.push(path.join(bowerrc.directory, dir));
					babelifyDir.push({
						dir: path.join(bowerrc.directory, dir),
						isSymlink: isSymlink,
						realPath: fs.realpathSync(path.join(bowerrc.directory, dir))
					});
				}
			}
		} catch(e) {}

	});
}

module.exports = {

}
