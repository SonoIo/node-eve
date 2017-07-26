import config from '../config.json'
import {version} from '../config.json'
console.log("%cTest import an JSON file", "color: #FFF; background: #000");
console.log(config);
console.log("Version %s", version);
console.log(''); 

import Foo from './Foo';
let foo = new Foo({name: "foo bar"});
let name = foo.value();

let str = `foo ${name}`;
console.log("%cTest concat a string in ES6:", "color: #FFF; background: #000");
console.log("let str = `foo ${name}`; result: %s", str);
console.log('');


const a = ["a", "b"];
const b = [...a, "c", "d"];
console.log("%cTest concat an array in ES6", "color: #FFF; background: #000");
console.log("%cDeclaration:", "color: #FFF; background: #000");
console.log('const a = ["a", "b"];');
console.log('const b = [...a, "c", "d"];');
console.log('b is worth ["a", "b", "c", "d"]', b);
console.log('');

const c = { "a": 1, "b": 2 };
const d = { ...c, "b": 3, "c": 4, "d": 5 };
console.log("%cTest transform rest properties for object destructuring assignment and spread properties for object literals.", "color: #FFF; background: #000");
console.log("%cDeclaration:", "color: #FFF; background: #000");
console.log('const c = { "a": 1, "b": 2 };');
console.log('const d = { ...c, "b": 3, "c": 4, "d": 5 };');
console.log('d is worth { "a": 1, "b": 3, "c": 4, "d": 5}', d);
console.log('');


console.log("%cTest underscore external library:", "color: #FFF; background: #000");
import _ from "underscore";
if ( _ && _.isString && _.isString("string") )
	console.log( `UnderscoreJS is loaded!` );
else
	console.log("%cUnderscoreJS not loaded!", "color: #FFF; background: red");

console.log('');

console.log("%cTest property of class:", "color: #FFF; background: #000");
console.log( `"${foo.instanceProperty}" is a value of 'instanceProperty' properties` );
console.log('');


export class WrongCategoryError extends Error {};
export class WrongCategoryError2 extends Error {};

window.WrongCategoryError  = WrongCategoryError;
window.WrongCategoryError2 = WrongCategoryError2;

window.err1 = new WrongCategoryError({message: "Error 1"});
window.err2 = new WrongCategoryError2({message: "Error 2"});

console.log("%cTest extend Error class", "color: #FFF; background: #000");


console.log("%cDeclaration:", "color: #FFF; background: #000");
console.log("export class WrongCategoryError extends Error {};");
console.log("export class WrongCategoryError2 extends Error {};");

console.log('window.err1 = new WrongCategoryError({message: "Error 1"});');
console.log('window.err2 = new WrongCategoryError2({message: "Error 2"});');

console.log("%cTest:", "color: #FFF; background: #000");
console.log( "`err1 instanceof WrongCategoryError` [TRUE]: %s", err1 instanceof WrongCategoryError ); // True
console.log( "`err1 instanceof Error` [TRUE]: %s", err1 instanceof Error ); // True
console.log( "`err1 instanceof WrongCategoryError2` [FALSE]: %s", err1 instanceof WrongCategoryError2 ); // False

console.log("`err1 == err2` [FALSE]: %s",err1 == err2 ); //False

console.log( "`err2 instanceof WrongCategoryError` [FALSE]: %s",err2 instanceof WrongCategoryError ); // False
console.log( "`err2 instanceof Error` [TRUE]: %s", err2 instanceof Error ); // True
console.log( "`err2 instanceof WrongCategoryError2` [TRUE]: %s", err2 instanceof WrongCategoryError2 ); // True
console.log('');

// "a" + "b"
//
// function foo2() {var x = 1;}
// function bar2() { var x = f(); }
// function baz() {
// 	var x = 1;
// 	console.log(x);
// 	function unused() {
// 		return 5;
// 	}
// }

//
// !function (){}()
// function runIt(fun){ fun(); }
// runIt(function (){let foo = new Foo();foo.destroy(); });
