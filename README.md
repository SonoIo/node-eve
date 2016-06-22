# EVE - Command line tool

Eve is a super simple command line tool for create HTML5 applications. It compiles into a single bundle JS library and module with Browseryfy.

## Install

```
$ npm install -g node-eve
```

## Usage

```
	Usage: eve [options] [command]

	Commands:

		init  [name]                   Crea il template di una app
		build [options] [type] [unit]  Compila l'applicazione
		start [options]                Esegue l'applicazione
		test  [options] <unit>         Testa l'applicazione
		extract [options]              Estrae le stringhe dall'applicazione e le restituisce in un file per la traduzione
		prepare <section>              Util for prepare a section
	Options:

		-h, --help     output usage information
		-V, --version  output the version number
```


### eve init [name]

```
$ eve init myapp
```

Initialize an application structure.


### eve build [type] [unit]

```
$ eve build      // Alias of ...
$ eve build dev  // Compile application of type development. Also provide source map file.
$ eve build dist // Compile application of type production. The code is minified.
$ eve build pub  // Compile application of type production. The code is minified and, optionally, obfuscated with jScramble.
```

### eve start

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
		"start": "eve start"
	},
	"eve-language": "es6",
	"eve-version": "2.0.0",
	"eve-configs-developement": {},
	"eve-configs-production": {},
	"eve-configs": {}
}
```

### eve-language

Identify the language of the source code. Possible values: `js`, `es6` (default is `js`). [Babelify](https://github.com/babel/babelify) is used.

### eve-version (not implemented yet)

Check the version of eve required by the project.

### eve-configs-developement

Punt into object the variables for developement mode.

### eve-configs-production

Punt into object the variables for production mode.

### eve-configs

The object is generated based on the compilation mode (`development` or `production`). Into your app require this object for read the variables.


## Tips & Tricks

### File limit

If `EMFILE` file error is triggered use the command `ulimit -n 2048` to fix it.

### Set environment variables on Windows

To set environment variables in Windows use the tool from ***System in Control Panel*** (or by typing `environment` into the search box in start menu). For more details read this discussion on [Stackoverflow](http://stackoverflow.com/a/9250168).

### Set environment variables on Linux or Mac


```
`nano ~/.profile`

export JSCRAMBLER_ACCESSKEY=<MY KEY>
export JSCRAMBLER_SECRETKEY=<MY SECRET>
```



## LICENSE

The MIT License (MIT)

Copyright (c) 2015

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
