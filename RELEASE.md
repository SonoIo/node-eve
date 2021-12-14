# Release notes

## 3.1.3
- Added support to old devices adding new build presets.

## 3.1.2
- Configure SCSS watch directory through `eve-watchify.directories`. If defined as an array of directory in your project package.json,
it will start watching it for changes and rebuild the CSS accordingly.

## 3.1.1
- Added parameter `--exorcist` to `eve test` command.

## 3.1.0
- New minify library that supports ES6+: [Terser](https://github.com/terser/terser).
- Fix an issue that keeps the debug options to true with build dist.

**Attention!** the supported min version is iOS 10.0 and Android 5.0 for a full support. See [Can I use](https://caniuse.com/const) for more info.

## 3.0.0
- Babel 7
  - [@babel/plugin-proposal-class-properties](https://babeljs.io/docs/en/babel-plugin-proposal-class-properties)
  - [@babel/plugin-proposal-export-default-from](https://babeljs.io/docs/en/babel-plugin-proposal-export-default-from)
  - [@babel/plugin-proposal-export-namespace-from](https://babeljs.io/docs/en/babel-plugin-proposal-export-namespace-from)
  - [@babel/plugin-proposal-nullish-coalescing-operator](https://babeljs.io/docs/en/babel-plugin-proposal-nullish-coalescing-operator)
  - [@babel/plugin-proposal-object-rest-spread](https://babeljs.io/docs/en/babel-plugin-proposal-object-rest-spread)
  - [@babel/plugin-proposal-optional-chaining](https://babeljs.io/docs/en/babel-plugin-proposal-optional-chaining)
- Added generators and async/await support
- Remove "extract translate string" (ets) package and command

## 2.5.10
- Added supprot to URL rewrite to index.html with `--urlrewrite` parameter

## 2.5.9
- Removed old libraries

## 2.5.8
- Bugfix *l10ns* library error that does not correctly download the *unicode-cldr* dependency

## 2.5.7
- Upgrade l10ns for compability node 8
- Change link pull requrst of library debowerify for compability node 8

## 2.5.6
- Added a watch on localizations files to format translations

## 2.5.5
- Change translation format to remove GIT conflict

## 2.5.4
- Upgrade l10ns to version

## 2.5.3
- Bugfix for l10ns watch

## 2.5.2
- upgrade app template

## 2.5.1
- integrate l10ns on eve build
- add new optional param for auto translate source

## 2.5.0
- Wrapper for l10ns package
- Implement the watcher for l10ns update and compile when file is compiled

## 2.4.3
- Added to the translation list the main file

## 2.4.2
- Added CORS on static server

## 2.4.1
- Enhanced suppor to test

## 2.4.0
- Introduced OptimizeJs after compile and minified in dist or pub mode.
- Improved BabelJS width new transforms.

## 2.3.1
- Add missing module

## 2.3.0

- eve configurations have been moved to separate files.
- New param `--config` for build a javascript.
- Bugfix for build scss width `pub` mode.
- Upgrade jscrambler.
- Create a eve config file `.everc`.
- Developed a simple example.


## 2.2.1

- Bug fix unit test

## 2.2.0

- Recompilation is much faster! Integrate `watchify` modules for recompile.
- Improvements and bug fixing.

## 2.1.0

- Added support to ES6 for bower components

## 2.0.0

- Added support to ES6
- Added new package.json `eve-language`
- Removed `eve-components`
