var path = require('path');

var api = module.exports = require('./lib/server/monitor.js');
api.WEB_ROOT = path.resolve(path.dirname(module.filename), './static');