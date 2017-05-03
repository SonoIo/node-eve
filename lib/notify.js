const _                  = require('underscore');
const path               = require('path');
const exec               = require('child_process').exec;
const NotificationCenter = require('node-notifier').NotificationCenter;
const pkgApp             = require(path.resolve('package.json'));
const appName            = pkgApp['name'];
const everc              = require('./everc')();
const defaultEditor      = everc['editor']||'';

const getCommandLine = function getCommandLine() {
   switch (process.platform) {
      case 'darwin' : return 'open';
      case 'win32' : return 'start';
      case 'win64' : return 'start';
      default : return 'xdg-open';
   }
}

const n = function n(options, done) {
	if ( _.isFunction(options) ){
		done    = options;
		options = {};
	}
	if (!_.isFunction(done))
		done = function () {};
	if (!_.isObject(options))
		options = {};


	options = _.defaults(options, {
		title: `Eve: ${appName}`,
		sound: false,
		group: 2
	});

	// console.log(options);

	var notifier = new NotificationCenter({
		withFallback: false, // Use Growl Fallback if <= 10.8
		customPath: void 0 // Relative/Absolute path to binary if you want to use your own fork of terminal-notifier
	});

	notifier.notify(
		options,
		function (err, response, metadata) {
			return done(err, response);
		}
	).on('click', function (notifierObject, opt) {
		if ( options.filename ){
			let line   = options.line;
			let column = options.column;

			switch (defaultEditor.toLowerCase()) {
				case "atom":
					exec(`${defaultEditor} ${options.filename}:${line||0}:${column||0}`);
					break;
				default:
					exec(`${getCommandLine()} ${options.filename}`);
					break;
			}
		}
	});

}

module.exports = {
	notifier: n,

	success: function success(subtitle, message, options){
		options = _.defaults(options||{}, {
			subtitle: subtitle,
			message: message,
			icon: path.join(__dirname, '..', 'icon.png'),
			appIcon: path.join(__dirname, '..', 'icon.png')
		});
		n(options);
	},

	error: function error(subtitle, message, options){
		options = _.defaults(options||{}, {
			subtitle: subtitle,
			message: message,
			icon: path.join(__dirname, '..', 'icon_error.png'),
			appIcon: path.join(__dirname, '..', 'icon.png'),
			timeout: 30,
			sound: 'Basso', // 'Sosumi'
			closeLabel: 'Close',
			actions: [ 'Open' ]
		});
		n(options);
	}
}
