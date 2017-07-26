import _ from "underscore";
export default class Foo {

	instanceProperty = "bork";

	constructor(options){
		this.name = options ? options.name : 'lollo';
	}

	value(){
		return this.name;
	}

};
