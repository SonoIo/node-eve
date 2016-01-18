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

		init [name]                    Crea il template di una app
		build [options] [type] [unit]  Compila l'applicazione
		start [options]                Esegue l'applicazione
		test [options] <unit>          Testa l'applicazione
		extract [options]              Estrae le stringhe dall'applicazione e le restituisce in un file per la traduzione

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
$ eve build // Alias of ...
$ eve build dev // Compile application of type development. Also provide source map file.
$ eve build dist // Compile application of type production. The code is minified.
$ eve build pub // Compile application of type production. The code is minified and, optionally, obfuscated with jScramble.
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


### eve test

```
$ eve test ModuleName
```

### eve 










## Tips & Tricks

### File limit

If `EMFILE` file error is triggered use the command `ulimit -n 2048` to fix it.

### Set environment variables on Windows

To set environment variables in Windows use the tool from ***System in Control Panel*** (or by typing `environment` into the search box in start menu). For more details read this discussion on [Stackoverflow](http://stackoverflow.com/a/9250168).

### Set environment variables on Linux or Mac


```
`nano ~/.profife`

export JSCRAMBLER_ACCESSKEY=<MY KEY>
export JSCRAMBLER_SECRETKEY=<MY SECRET>
```



## LICENSE

MIT 
Copyright (c) 2015

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.


