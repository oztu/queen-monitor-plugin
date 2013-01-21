var protocol = require('../protocol.js'),
	its = require('its'),
	utils = require('./utils.js'),
	EventEmitter = require('events').EventEmitter,
	MESSAGE_TYPE = protocol.MONITOR_MESSAGE_TYPE,
	WORKER_PROVIDER_MESSAGE_TYPE = protocol.WORKER_PROVIDER_MESSAGE_TYPE;

var create = module.exports = function(queen, config, options){
	options = options || {};

	var monitorSocket = config && config.monitorSocket || queen.acquireWebSocketEndpoint('/monitor');
	var monitor = new Monitor(queen, monitorSocket);
	
	if(options.log) monitor.log = options.log;
	if(options.debug) monitor.debug = options.debug;

	return getApi(monitor);
};

function getApi(monitor){
	var api = {};
	api.on = monitor.emitter.on.bind(monitor.emitter);
	api.removeListener = monitor.emitter.on.bind(monitor.emitter);
	api.kill = monitor.kill.bind(monitor);

	return api;
}

var Monitor = function(queen, socket){
	its.object(queen, "Queen instance required");
	its.object(socket, "Socket instance required");

	this.sockets = [];
	this.workerProviderUnbindList = [];
	this.emitter = new EventEmitter();
	this.queen = queen;
	
	this.api = getApi(this);

	socket.on('disconnect', this.kill.bind(this));
	socket.on('connection', this.connectionHandler.bind(this));
	queen.on('workerProvider', this.workerProviderHandler.bind(this));
	queen.assignHttpEndpoint('/monitor/', require('../../').WEB_ROOT);
};

Monitor.prototype.log = utils.noop;
Monitor.prototype.debug = utils.noop;

Monitor.prototype.kill = function(){
	this.emitter.emit('dead');
};

Monitor.prototype.sendToSockets = function(message){
	message = JSON.stringify(message);

	this.sockets.forEach(function(socket){
		socket.send(message);
	});
};

Monitor.prototype.connectionHandler = function(socket){
	var self = this;

	this.sockets.push(socket);
	socket.on('disconnect', function(){
		var index = self.sockets.indexOf(socket);
		if(!~index) return;
		self.sockets.splice(index, 1);
	});


	this.queen.workerProviders.forEach(function(workerProvider){
		var message = JSON.stringify([
			MESSAGE_TYPE['new worker provider'],
			workerProvider.toMap()
		]);

		socket.send(message);
	});
};

Monitor.prototype.sendWorkerProviderMessage = function(workerProvider, message){
	this.sendToSockets([
		MESSAGE_TYPE['worker provider message'],
		workerProvider.id,
		message
	]);
};

Monitor.prototype.workerProviderHandler = function(workerProvider){
	var self = this;

	this.sendToSockets([
		MESSAGE_TYPE['new worker provider'],
		workerProvider.toMap()
	]);

	workerProvider.on('dead', function(){
		self.sendWorkerProviderMessage(workerProvider, [
			WORKER_PROVIDER_MESSAGE_TYPE['dead']
		]);
	});

	workerProvider.on('worker', function(){
		self.sendWorkerProviderMessage(workerProvider, [
			WORKER_PROVIDER_MESSAGE_TYPE['worker spawned']
		]);
	});

	workerProvider.on('workerDead', function(){
		self.sendWorkerProviderMessage(workerProvider, [
			WORKER_PROVIDER_MESSAGE_TYPE['worker dead']
		]);
	});

	workerProvider.on('unresponsive', function(){
		self.sendWorkerProviderMessage(workerProvider, [
			WORKER_PROVIDER_MESSAGE_TYPE['unresponsive']
		]);
	});

	workerProvider.on('responsive', function(){
		self.sendWorkerProviderMessage(workerProvider, [
			WORKER_PROVIDER_MESSAGE_TYPE['responsive']
		]);
	});

	workerProvider.on('available', function(){
		self.sendWorkerProviderMessage(workerProvider, [
			WORKER_PROVIDER_MESSAGE_TYPE['available']
		]);
	});

	workerProvider.on('unavailable', function(){
		self.sendWorkerProviderMessage(workerProvider, [
			WORKER_PROVIDER_MESSAGE_TYPE['unavailable']
		]);
	});
};
