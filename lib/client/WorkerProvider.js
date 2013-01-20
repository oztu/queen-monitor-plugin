var _ = require('underscore/underscore.js'),
	$ = require('./lib/jqueryModule.js'),
	EventEmitter = require('../client/lib/eventEmitter.js').EventEmitter,
	utils = require('../client/utils.js'),
	MESSAGE_TYPE = require('../protocol.js').WORKER_PROVIDER_MESSAGE_TYPE;

var create = module.exports = function(config){
	var workerProvider = new WorkerProvider(config);
	return workerProvider;
};

var WorkerProvider = function(config){
	this.emitter = new EventEmitter();
	this.id = config.id;
	this.attributes = config.attributes;
	this.workerCount = config.workerCount;
	this.maxWorkers = config.maxWorkers;
	this.isAvailable = config.isAvailable;
	this.isResponsive = config.isResponsive;
	this.on = _.bind(this.emitter.on, this.emitter);
	this.removeListener = _.bind(this.emitter.removeListener, this.emitter);
	
	this.kill = _.once(_.bind(this.kill, this));
	this.update();
};

WorkerProvider.prototype.kill = function(){
	var self = this;
	self.emitter.emit("update");
	this.emitter.emit('dead');
};

WorkerProvider.prototype.update = function(){
	this.emitter.emit("update", {
		name: this.attributes.name || "Unknown",
		platform: this.attributes.os || "",
		family: this.attributes.family || "",
		majorVersion: this.attributes.version.major || 0,
		workerCount: this.workerCount,
		unavailable: this.isAvailable !== true,
		unresponsive: this.isResponsive !== true
	});
};

WorkerProvider.prototype.messageHandler = function(message){
	switch(message[0]){
		case MESSAGE_TYPE['dead']:
			this.kill();
		break;
		case MESSAGE_TYPE['unresponsive']:
			this.unresponsive();
		break;
		case MESSAGE_TYPE['responsive']:
			this.responsive();
		break;
		case MESSAGE_TYPE['worker spawned']:
			this.newWorker();
		break;
		case MESSAGE_TYPE['worker dead']:
			this.workerDead();
		break;
		case MESSAGE_TYPE['available']:
			this.available();
		break;
		case MESSAGE_TYPE['unavailable']:
			this.unavailable();
		break;
	}
};

WorkerProvider.prototype.newWorker = function(){
	this.workerCount++;
	this.update();
	this.emitter.emit('newWorker');
};

WorkerProvider.prototype.workerDead = function(){
	this.workerCount--;
	this.update();
	this.emitter.emit('workerDead');
};

WorkerProvider.prototype.available = function(){
	this.isAvailable = true;
	this.update();
	this.emitter.emit('available');
};

WorkerProvider.prototype.unavailable = function(){
	this.isAvailable = false;
	this.update();
	this.emitter.emit('unavailable');
};

WorkerProvider.prototype.responsive = function(){
	this.isResponsive = true;
	this.update();
	this.emitter.emit('responsive');
};

WorkerProvider.prototype.unresponsive = function(){
	this.isResponsive = false;
	this.update();
	this.emitter.emit('unresponsive');
};
