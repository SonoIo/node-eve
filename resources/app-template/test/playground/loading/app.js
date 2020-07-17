import _ from 'underscore';
import $ from 'jquery';
import Backbone from 'backbone';
import { State } from 'backbone.uikit';
import backboneTouch from 'backbone.touch';
import context from 'context-utils';
import PubSub from 'backbone.pubsub';
import Settings from 'settings-utils';
import Device from 'device-utils';
import Cache from 'cache-utils';
import Viewstack from 'backbone.viewstack';
import pkg from '../../../package.json';

// Global object for debugging
window.$ = $;
Backbone.$ = $;
Backbone.jQuery = $;
window._ctx = context;

// Initialize context utilities
context.pubsub = PubSub;
context.device = Device;
context.settings = new Settings();
context.cache = new Cache();
context.state = new State();

// Mock
context.loadingScreen = {
	show: () => { console.log('Loading show...') },
	hide: () => { console.log('Loading hide...') }
};
context.tabs = {
	getActiveState: () => { return context.state }
};
context.auth = {
	isLoggedIn: () => true,
	shouldRefreshToken: () => false
};
context.user = {};
context.collections = {};

// Load config.json
global.env = {};
let config = require('../../../config.json');
_.extend(global.env, config);
global.env.APP_ENV = global.env.env;

// Initialize viewstack
let viewstack = new Viewstack({ el: '#application' });
context.viewstack = viewstack;
context.state.set('viewstack', viewstack);
viewstack.render();

// Include the test script
require('./test');
