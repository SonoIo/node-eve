
module.exports = function beautifyTime(diff) {
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
}
