﻿var config = require('./config.json');
process.env.NODE_ENV = config['server']['mode'];

var logger = require('./../../Common/sources/logger'),
	express = require('express'),
	http = require('http'),
	https = require('https'),
	fs = require("fs"),
	docsCoServer = require('./DocsCoServer'),
	app = express(),
	server = null;

if (config['ssl']) {
	var privateKey = fs.readFileSync(config['ssl']['key']).toString(),
		certificate = fs.readFileSync(config['ssl']['cert']).toString(),
		options = {key: privateKey, cert:certificate};

	server = https.createServer(options, app);
} else {
	server = http.createServer(app);
}

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

docsCoServer.install(server, function() {
	server.listen(config['server']['port'], function() {
		logger.info("Express server listening on port %d in %s mode", config['server']['port'], app.settings.env);
	});
	
	app.get('/index.html', function(req, res) {
		res.send('Server is functioning normally');
	});

	app.get('/CommandService.ashx', onServiceCall);
	app.post('/CommandService.ashx', onServiceCall);

	function onServiceCall (req, res) {
		var result = docsCoServer.commandFromServer(req.query);
		result = JSON.stringify({'key': req.query.key, 'error': result});

		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', result.length);
		res.send(result);
	}
});
