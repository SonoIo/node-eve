import _  from "underscore";
import AppCollection from "./AppCollection";

export default class GeoCollection extends AppCollection {

	setGeolocation(geolocation) {
		if (this._geolocation) {
			this._geolocation(null, null, this);
		}
		this._geolocation = geolocation;
		this.listenTo(this._geolocation, 'change', this.onCurrentPositionChange);
	}

	getGeolocation() {
		if (this._geolocation)
			return this._geolocation;
		else
			return null;
	}

	onCurrentPositionChange(newPosition) {
		this.each(function (aModel) {
			aModel.getDistanceFromLatLng([ newPosition.latitude, newPosition.longitude ]);
			aModel.trigger('change:distance', aModel);
			aModel.trigger('change', aModel);
		});

		if (this._comparatorType == 'distance') {
			this.sort();
		}

		this.trigger('change:position', newPosition);
	}

	near(position, radius) {
		if (arguments.length == 1) {
			radius = arguments[0];

			let geolocation = this.getGeolocation();
			if (geolocation)
				position = geolocation.getLastKnownPosition();
			else
				position = null;
		}

		if (!position)
			return [];

		let nearModels = this.filter(function (aModel) {
			return aModel.getDistanceFromLatLng([ position.latitude, position.longitude ], { cache: false }) < radius;
		});

		return nearModels;
	}

};
