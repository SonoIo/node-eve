# EVE - Command line tool

Eve is a super simple command line tool for create HTML5 applications. It compiles into a single bundle JS library and module with Browseryfy.


http://blog.dekstroza.io/ulimit-shenanigans-on-osx-el-capitan/


## Install

```
$ npm install -g node-eve
```

## Usage

```
	Usage: eve [options] [command]

	Commands:

		init  [name]                    Initialize an application structure
		build [options] [type] [config] Build app width type
		start [options] [config]        Build an app in develop mode and start webserver
		test  [options] <unit>          Build and start webserver for test
		extract [options]               Extract all strings for translation

	Options:

		-h, --help     output usage information
		-V, --version  output the version number
```


### eve init [name]

```
$ eve init myapp
```

Initialize an application structure.


### eve build [type] [config]

```
$ eve build      // Alias of ...
$ eve build dev  // Compile application of type development. Also provide source map file.
$ eve build dist // Compile application of type production. The code is minified.
$ eve build pub  // Compile application of type production. The code is minified and, optionally, obfuscated with jScramble.

// Specify a custom configuration file

$ eve build pub --config config-custom.json

```

### eve start [options] [config]

```
$ eve start
```

This comand compile the application each time a file is changed. Eve is listening folders:

- `templates`
- `locales`
- `lib`
- `test`
- `styles`

Also it starts a web server, so as to allow the application display in browser. The default port is `5000` but if you change it run the command

```
$ eve start -p 5001

// Specify a custom configuration file

$ eve start --config config-custom.json

```


### eve test

```
$ eve test ModuleName
```

### eve extract

```
$ eve extract -d ./myapp/ -o ./myapp/file.json
```

Generate file for translations strings. File oupts are `po`, `json` or `txt`. More informations read the documentation of [ets] (https://github.com/vash15/extract-translate-string).


## Packege.json of your app

```
{
	"name": "{{APP_NAME}}",
	"version": "1.0.0",
	"description": "",
	"author": "",
	"license": "",
	"main": "./lib/app.js",
	"scripts": {
		"start": "eve start",
		"dist": "eve build dist"
		"pub": "eve build pub",
		"pre": "eve build pub --config config-pre-production.json"
	},
	"eve-language": "es6",
	"eve-version": "2.3.0",
	"eve-build-date": "2017-4-26"
}
```

### eve-language

Identify the language of the source code. Possible values: `js`, `es6` (default is `js`). [Babelify](https://github.com/babel/babelify) is used.

### eve-version (not implemented yet)

Check the version of eve required by the project.

### eve-watchify

The configuration for watchify. For more information see [watchify](https://github.com/substack/watchify).
Defaults:

```
	{
		delay: 500,
		ignoreWatch: [ 'bundle.js', 'styles.css', 'package.json', '**/styles/**', '**/node_modules/**' ],
		poll: false
	}
```

### config-developement.json file

Punt into object the variables for developement mode.

### config-production.json file

Punt into object the variables for production mode.

### config.json file

The object is generated based on the compilation mode (`development` or `production`). Into your app require this object for read the variables.

### .everc file

This is a file configuration for eve.

Params:

- `editor`: this field indicates the editor that will open when the user clicks on the notification.

```
{
	"editor": "atom"
}
```

## Tips & Tricks

### File limit

If `EMFILE` file error is triggered use the command `ulimit -n 2048` to fix it.
