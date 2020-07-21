import _ from "underscore";
import { Model, Collection } from "backbone";

// ***** NOTA *****
//
// è possibile fare il mock di una collection sovrascrivendo sync
//
// 	sync(method, collection, options) {
//
// 		if (method !== 'read') return super.sync(method, collection, options);
//
// 		const dummy = [
// 			{id: '000', name: "Primo Prodotto"},
// 			{id: '111', name: "Secondo Prodotto"},
// 			{id: '222', name: "Terzo Prodotto"},
// 			{id: '333', name: "Quarto Prodotto"},
// 			{id: '444', name: "Quinto Prodotto"},
// 			{id: '555', name: "Sesto Prodotto"},
// 		];
//
// 		setTimeout(() => {
// 			this.trigger('request', collection, {}, options);
// 			options.success(dummy);
// 		}, 1000);
//
// 	}

/**
 * Rappresenta la classe base di tutte le collection
 * @version 1.0.0
 */
export default class AppCollection extends Collection {

	constructor(models, options){
		super(models, options);
		this.options = _.defaults(options || {}, {
			currentPageName: null,
			pageSizeName: null,
			startPage: 0,
			pageSize: 20
		});
		this.previousFetchData = {};
		this.moreToLoad = true;
		this.fetched = false;

		if (this.onInit) this.onInit();
	}

	fetch(options) {
		options || (options = {});

		if (!options || !options.loadMore) {
			this.moreToLoad = true;
		}

		let data = options.data || {};
		this.previousFetchData = _.clone(data);

		// Rinomina i campi usati per la paginazione da quelli standard
		// a quelli usati dai servizi veri e propri.
		if ( this.options.currentPageName && this.options.currentPageName != 'currentPage'  ) {
			if ( 'currentPage' in data  ){
				options.data[this.options.currentPageName] = data.currentPage;
				delete options.data['currentPage'];
			}else{
				if (!options.data) options.data = {};
				options.data[this.options.currentPageName] = this.options.startPage;
			}
		}
		if ( this.options.pageSizeName ) {
			if ('pageSize' in data && this.options.pageSizeName != 'pageSize') {
				options.data[this.options.pageSizeName] = options.data.pageSize;
				delete options.data['pageSize'];
			} else if (!(options.data || {})[this.options.pageSizeName]) {
				if (!options.data) options.data = {};
				options.data[this.options.pageSizeName] = this.options.pageSize;
			}
		}

		let success = options.success;
		let error   = options.error;

		options.success = (collection, resp, opt) => {
			this.fetched    = true;
			this.fetching   = false;
			this.moreToLoad = options.data ? collection.size() == options.data[this.options.pageSizeName] : false;
			if (success) success.call(options.context, collection, resp, opt);
		};
		options.error = (collection, resp, options) => {
			this.fetching = false;
			if (error) error.call(options.context, collection, resp, options);
		};
		this.fetching = true;
		return super.fetch(options);
	}

	/**
	 * Indica se la collection è in fetching
	 * @return {Boolen}
	 */
	isFetching() {
		return !!this.fetching;
	}

	/**
	 * Indica se la collection è stato fetchato
	 * @return {Boolen}
	 */
	isFetched() {
		return !!this.fetched;
	}

	/**
	 * Carica altri model nella collection
	 * @version 1.0.0
	 * @param  {Object}   options opzioni per il caricamento dei modelli
	 * @param  {Function} done    callback
	 * @return {Object}           fetch result
	 */
	loadMore(options, done) {
		if (!this.moreToLoad) {
			_.defer(function () {
				return done(null, false, 0);
			});
			return;
		}

		if (typeof options === 'function') {
			done = options;
			options = {};
		}

		if (!_.isObject(options))
			options = {};

		let data      = _.defaults(options.data || {}, this.previousFetchData);
		let oldLength = this.length;
		let offset    = oldLength;

		options.limit  = options.limit || data[this.options.pageSizeName] || this.options.pageSize;
		options.offset = offset;
		options.remove = false;
		options.add    = offset > 0;
		options.reset  = offset === 0;

		data.currentPage = this.options.startPage + Math.floor(offset/options.limit);
		data.pageSize    = options.limit;

		// Indica al fetch che questa chiamata è la continuazione
		// di quella precedente
		options.loadMore = true;
		options.data = data;

		options.success = (collection, response, opt) => {
			this.fetching = false;
			if (done) {
				let moreToLoad = this.moreToLoad = collection.length - oldLength == options.limit;
				done(null, moreToLoad, collection.length - oldLength, oldLength);
			}
		};
		options.error = (collection, response, options) => {
			this.fetching = false;
			if (done) done(new Error(response));
		};

		this.fetching = true;
		return this.fetch(options);
	}

	/**
	 * Elabora la risposta del server
	 * @param  {Object} response - Risposta del server
	 * @param  {Object} options - Opzioni di backbone
	 * @return {Object} - Attributi della risposta, errori o messaggi
	 */
	parse(response, options) {
		if (this.onInit) this.onInit();
		return response;
	}

}

AppCollection.prototype.fetching = false;
