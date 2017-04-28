const path = require('path');
const fs = require('fs');

module.exports = function () {
	let configs = {};
	try{
		configs = JSON.parse(fs.readFileSync(path.resolve('.everc'), 'utf8'));
	}catch(e){
		configs = {};
	}
	return configs;
}
