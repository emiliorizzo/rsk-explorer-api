'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.errors = exports.getModuleName = exports.getModule = exports.getDelayedFields = exports.publicSettings = exports.formatError = exports.formatRes = exports.remove$ = exports.filterSort = exports.filterQuery = exports.filterFields = exports.getLimit = exports.filterParams = undefined;var _types = require('../lib/types');Object.defineProperty(exports, 'errors', { enumerable: true, get: function () {return _types.












































































































    errors;} });var _config = require('../lib/config');var _config2 = _interopRequireDefault(_config);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}const delayedFields = _config2.default.api.delayedFields || {};const { MAX_LIMIT, LIMIT, MIN_LIMIT } = _config2.default.api;const filterParams = exports.filterParams = params => {params = params || {};let { limit, sort, fields, query } = params;params.limit = getLimit(limit);params.query = filterQuery(query);params.sort = filterSort(sort);params.fields = filterFields(fields);return params;};const getLimit = exports.getLimit = limit => {limit = limit || LIMIT;limit = limit > MAX_LIMIT ? MAX_LIMIT : limit;limit = limit < MIN_LIMIT ? MIN_LIMIT : limit;return limit;};const filterFields = exports.filterFields = fields => {if (!fields) return;let filtered = {};for (let p in fields) {let k = remove$(p);filtered[k] = fields[p] ? 1 : 0;}return filtered;};const filterQuery = exports.filterQuery = query => {if (!query) return;if (typeof query === 'object') {if (Object.keys(query).length > 0) {return sanitizeQuery(query);}}};const filterSort = exports.filterSort = sort => {if (!sort) return;let filtered = null;if (sort && typeof sort === 'object') {let keys = Object.keys(sort);filtered = {};for (let k of keys) {let val = sort[k];filtered[k] = !val || val === 1 ? 1 : -1;}}return retFiltered(filtered);};const sanitizeQuery = query => {let filtered = {};for (let p in query) {let k = remove$(p);if (k === p) filtered[k] = query[p];}return retFiltered(filtered);};const retFiltered = filtered => {return filtered && Object.keys(filtered).length > 0 ? filtered : null;};const remove$ = exports.remove$ = value => value.replace('$', '');const formatRes = exports.formatRes = payload => {let { module, action, result, req, error } = payload;module = module ? getModuleName(module) : null;let data, pages, next, prev, delayed;if (!result && !error) error = _types.errors.EMPTY_RESULT;if (error) {error = formatError(error);} else {({ data, pages, next, prev, delayed } = result);}if (!data && !error) {if (req.getDelayed && delayed && delayed.registry) {error = formatError(_types.errors.UPDATING_REGISTRY);} else {error = formatError(_types.errors.EMPTY_RESULT);}}return { module, action, data, req, pages, error, prev, next, delayed };};const formatError = exports.formatError = error => {error.serverTime = Date.now();return error;};const publicSettings = exports.publicSettings = () => {return _config2.default.publicSettings;};const getDelayedFields = exports.getDelayedFields = (module, action) => {let delayed = delayedFields[module] ? delayedFields[module][action] : null;if (delayed) delayed.module = module;return delayed;};const getModule = exports.getModule = module => _types.modules[module] || module;const getModuleName = exports.getModuleName = key => Object.keys(_types.modules)[Object.values(_types.modules).indexOf(key)] || key;