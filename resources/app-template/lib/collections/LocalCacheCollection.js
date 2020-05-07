import _ from "underscore";
import {waterfall} from "async";
import ajax from "../utils/ajax";
import moment from "moment";
import AppCollection from "./AppCollection";
import {l} from "../utils";


// {
// 	options: {
// 		ttl: { minutes: 20 },
// 		created: "2017-123123"
// 	},
// 	models: [ ]
// }


// La collection aiuta a fare una cache locale nel dispositivo,tramite il file sistem

export default class LocalCacheCollection extends AppCollection {

	constructor(models, options){
		super(models, options);

		this.toFetch = null;
		this.options = _.defaults(options||{}, {
			ttl: null, // Per dare una vita massima alla cache
			defaultAssetsPath: null, // Questo path indica i dati base installati con l'app. QUesti dati verranno letti solamente se la cache è vuota.
			cacheFileName: `${this.constructor.name.toLowerCase()}.json`, // Nome del file da salvare in cache
		});

	}

	fetch(options){
		options = _.defaults(options||{}, {
			cache: LocalCacheCollection.CACHE_ENABLED,
			delay: null,
			success: ()=>{},
			error: ()=>{}
		});

		const delay    = options.delay;
		const cache    = options.cache;
		const oSuccess = options.success;
		const oError   = options.error;


		switch (options.cache) {
			case LocalCacheCollection.CACHE_DISABLED:
				return super.fetch(options);
			break;
			case LocalCacheCollection.CACHE_READ_ONLY:
				this.cacheRead(options, (err, data)=>{
					if ( err )
						return oError(this, new Error(`Error on read ${this.options.cacheFileName} cache file`), options );
					return oSuccess(this, options);
				});
				return null;
			break;
			case LocalCacheCollection.CACHE_UPDATE:
				options.success = (collection, resp) => {
					// Chiamo subito la callback per l'utente
					oSuccess(this, options);
					// Salvo la risposta
					this.cacheSave(resp, ()=>{
						// console.log("[%s] Collection %s saved!", options.cache, this.options.cacheFileName );
					});

				};

				if ( !_.isNumber(delay) )
					return super.fetch(options);

				if ( this.toFetch )
					clearTimeout(this.toFetch);
				this.toFetch = setTimeout(()=>{
					this.toFetch = null;
					return super.fetch(options);
				}, delay);

			break;
			case LocalCacheCollection.CACHE_ENABLED:
			default:
				// Leggo subito dal file locale e richiamo la callback allo user
				let successFullCache = false;
				// Sovrascrivo il success per poi savare in cache il risultato dal server
				options.success = (collection, resp) => {
					// Se la cache ha dato errore di lettura, lancio il success originale dell'utente
					if ( !successFullCache )
						oSuccess(this, options);

					// Salvo la risposta
					this.cacheSave(resp, ()=>{
						// console.log("[%s] Collection %s saved!", options.cache, this.options.cacheFileName );
					});

				};

				this.cacheRead(options, (err, data)=>{
					if ( !err ){
						successFullCache = true;
						oSuccess(this, options);
					}

					if ( !_.isNumber(delay) || err || !data )
						return super.fetch(options);

					if ( this.toFetch )
						clearTimeout(this.toFetch);
					this.toFetch = setTimeout(()=>{
						this.toFetch = null;
						return super.fetch(options);
					}, delay);

				});
			break;
		}

	} // End fetch


	cacheRead(options, done) {
		if ( _.isFunction(options) ){
			done    = options;
			options = {};
		}

		if ( !_.isFunction(done) )
			done = () => {};

		const defaultAssetsPath = this.options.defaultAssetsPath;
		const finalyRead        = (err, data) => {
			// console.log(options.network, err, data);
			if ( err )
				return done(err);

			if ( !_.isObject(data) )
				return done(new Error("Error on read JSON data.") );

			const opt     = data.options||{};
			const ttl     = opt.ttl;
			const created = opt.created;
			let models    = data.models;

			if ( ttl && _.isObject(ttl) && !_.isEmpty(created) && moment(created).isBefore( moment().subtract(ttl) ) ){
				models = [];
			}

			if ( options.reset ){
				let resetOptions = {
					silent: false,
					parse: true
				};
				switch (options.cache) {
					case LocalCacheCollection.CACHE_DISABLED:
					break;
					case LocalCacheCollection.CACHE_READ_ONLY:
					break;
					case LocalCacheCollection.CACHE_UPDATE:
						resetOptions.silent = true;
					break;
					case LocalCacheCollection.CACHE_ENABLED:
					default:
						resetOptions.silent = true;
					break;
				}

				this.reset(models, resetOptions);

			}else{
				this.set(models, { parse: true });
			}

			if (!options.silent) {
				this.trigger('sync', this, null, options);
			}

			return done(null, models);
		};

		if ( !window.cordova ){
			if ( !defaultAssetsPath )
				return done();
			return this.callbackReadFromBrowser(defaultAssetsPath, finalyRead);
		}

		const cdv             = window.cordova;
		const platformId      = cdv.platformId;
		const platformVersion = cdv.platformVersion || "";
		const file            = cdv.file;
		const cacheFileName   = `${file.cacheDirectory}${this.options.cacheFileName}`;
		// controllo se devo aggiungere la cartella www/. Per le versioni di Cordova Android 7 è neccessario aggiungere la www/
		const defaultFileName = `${file.applicationDirectory}${ platformId == 'ios' ? 'www/' : ( parseInt(platformVersion.split(".")[0]) < 7 ? '' : 'www/'  ) }${defaultAssetsPath}`;

		waterfall([
			// Resolve della cache
			(next)=>{
				this.resolveLocalFileSystemURL(
					cacheFileName,
					(err, fileEntry) => {
						return next(null, fileEntry);
					}
				);
			},
			// Controllo se ho il file entry
			(fileEntry, next)=>{
				if ( !fileEntry )
					return next(null, null);
				// Leggo il file in cache
				this.readBinaryFile(fileEntry, (err, data)=>{
					if ( err )
						return next(null, null);
					return next(null, data);
				});
			},
			// Risolvo il file base se ne ho bisogno
			(data, next)=>{
				if ( _.isObject(data) )
					return next( null, null, data );

				this.resolveLocalFileSystemURL(
					defaultFileName,
					(err, fileEntry) => {
						return next(null, fileEntry, null);
					}
				);

			},
			// Leggo il file base se ne ho bisogno
			(fileEntry, data, next)=>{
				if ( _.isObject(data) )
					return next( null, data );

				if ( !fileEntry )
					return next( null, null );
				// Leggo il file base
				this.readBinaryFile(fileEntry, (err, data)=>{
					return next(err, data);
				});
			},

		], (err, data) => {
			return finalyRead(err, data);
		});

	}

	cacheSave(rawData, done){
		if ( !_.isFunction(done) ){
			done = () =>{};
		}

		if ( !window.cordova )
			return done();

		const cdv      = window.cordova;
		const cacheDir = cdv.file.cacheDirectory;
		const data     = {
			options: {
				created: moment().toISOString(),
				ttl: this.options.ttl,
				defaultAssetsPath: this.options.defaultAssetsPath
			},
			models: rawData
		};

		waterfall([
			(next) => {
				this.resolveLocalFileSystemURL(
					cacheDir,
					(err, dir) => {
						return next(err, dir);
					}
				);
			},
			(dir, next) => {
				dir.getFile(
					this.options.cacheFileName,
					{create: true},
					(fileEntry) => {
						return next(null, fileEntry);
					},
					(err) => {
						return next(err);
					}
				);
			},
			(fileEntry, next) => {
				if (!fileEntry)
					return next(new Error('File entry not found.'));

				fileEntry.createWriter(function (fileWriter) {

					fileWriter.onwriteend = function() {
						return next();
					};

					fileWriter.onerror = function (e) {
						return next(e);
					};

					const dataBlob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
					fileWriter.write(dataBlob);
				});
			}
		], (err)=>{
			return done(err);
		});

	}

	// Read a file from disk
	readBinaryFile(fileEntry, done) {
		fileEntry.file(
			(file) => {
				const reader = new FileReader();
				reader.onloadend = function() {
					let json;
					try{
						json = JSON.parse(this.result);
					}catch(e){
						json = null;
					}
					return done(null, json);
				};
				reader.readAsText(file);
			},
			(err) => {
				return done(err);
			}
		);
	}

	resolveLocalFileSystemURL(path, done) {
		window.resolveLocalFileSystemURL(path, (fileEntry) => {
			return done(null, fileEntry);
		}, (err) => {
			switch (err.code) {
				case FileError.QUOTA_EXCEEDED_ERR:
					return done(new Error(l('LOCAL_CACHE_COLLECTION->INSUFFICIENT_DISK_SPACE')));
					break;
				case FileError.NOT_FOUND_ERR:
					return done(new Error(l('LOCAL_CACHE_COLLECTION->FILE_NOT_FOUND')));
					break;
				case FileError.SECURITY_ERR:
					return done(new Error(l('LOCAL_CACHE_COLLECTION->SECURITY_ERROR')));
					break;
				case FileError.INVALID_MODIFICATION_ERR:
					return done(new Error(l('LOCAL_CACHE_COLLECTION->INVALID_MODIFICATION_ERROR')));
					break;
				case FileError.INVALID_STATE_ERR:
					return done(new Error(l('LOCAL_CACHE_COLLECTION->INVALID_STATE_ERROR')));
					break;
				case FileError.ENCODING_ERR:
					return done(new Error(l('LOCAL_CACHE_COLLECTION->ENCODING_ERROR')));
					break;
				default:
					return done(err);
					break;
			};
		});
	}

	callbackReadFromBrowser(filename, done){
		ajax(filename, done);
	}


}

LocalCacheCollection.CACHE_DISABLED  = 0; // Non legge e non aggiorna la cache. Chiama solo il serzio
LocalCacheCollection.CACHE_READ_ONLY = 1; // Legge solo dalla cache ma non chiama il servizio
LocalCacheCollection.CACHE_UPDATE    = 2; // non legge dalla cache, chiama il servizio e salva i nuovi dati.
LocalCacheCollection.CACHE_ENABLED   = 3; // Legge dalla cache, lancia il success all'utente. In chiama il servizio che al suo success aggiorna il file di cache.
