import _ from "underscore";
import $ from "jquery";

let config = require('../config.json');

console.log(config);
// asdasdasd::;

const a = ["a", "b"];

console.log("LoooL");
console.log(a, _.isArray(a) );

$('body').css({ "background": "red", "height":"350px"});


export class WrongCategoryError extends Error {};
export class WrongCategoryError2 extends Error {};



window.err1 = new WrongCategoryError({message: "Error 1"});
window.err2 = new WrongCategoryError2({message: "Error 2"});

console.log("%cTest extend Error class:", "color: #FFF; background: #000");


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
