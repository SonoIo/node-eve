var sass = require('node-sass');
var path = require('path');
var fs   = require('fs');

module.exports = function (mode, done) {
	var time = process.hrtime();

	mode = mode || 'dev';

	var outFile = path.resolve(path.join('build', 'assets', 'css', 'style.css'));
	var mapFile = path.resolve(path.join('build', 'assets', 'css', 'style.css.map'));

	sass.render({
		file: path.resolve(path.join('styles', 'style.scss')),
		sourceMap: mode != 'dist',
		outFile: outFile,
		outputStyle: mode == 'dist' ? 'compressed' : null,
		success: function(result) {
			fs.writeFile(outFile, result.css, function (err) {
				if (err) return done(err);
				if (mode == 'dist') {
					if (fs.existsSync(mapFile))
						fs.unlinkSync(mapFile);
					return done(null, beautifyTime(process.hrtime(time)));
				}
				fs.writeFile(mapFile, result.map, function (err) {
					if (err) return done(err);
					done(null, beautifyTime(process.hrtime(time)));
				});
			});
		},
		error: function(err) {
			err.toString = function () {
				var out = '';
				out += 'line ' + this.line + ', column ' + this.column + ' \n'; 
				out += this.message
				return out;
			};
			done(err);
		}
		// includePaths: [ 'lib/', 'mod/' ],
	});

	function beautifyTime(diff) { 
		var out = '';
		if (diff[0] > 0) {
			out += diff[0];
			out += '.';
			out += parseInt( diff[1] / 1e6 ) + 's'
		}
		else {
			out += parseInt( diff[1] / 1e6 ) + 'ms'
		}
		return out;
	};

};
