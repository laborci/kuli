#!/usr/bin/env node

const fs = require('fs');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const terminal = require('terminal-kit').terminal;
const Twig = require('twig');
const ccase = require("change-case");

Twig.extendFilter("camelCase", (value) => ccase.camelCase(value));
Twig.extendFilter("capitalCase", (value) => ccase.capitalCase(value));
Twig.extendFilter("constantCase", (value) => ccase.constantCase(value));
Twig.extendFilter("dotCase", (value) => ccase.dotCase(value));
Twig.extendFilter("headerCase", (value) => ccase.headerCase(value));
Twig.extendFilter("noCase", (value) => ccase.noCase(value));
Twig.extendFilter("paramCase", (value) => ccase.paramCase(value));
Twig.extendFilter("pascalCase", (value) => ccase.pascalCase(value));
Twig.extendFilter("pathCase", (value) => ccase.pathCase(value));
Twig.extendFilter("sentenceCase", (value) => ccase.sentenceCase(value));
Twig.extendFilter("snakeCase", (value) => ccase.snakeCase(value));

const cwd = process.cwd() + "/";

const KULI_SLAVES = cwd + '.kuli-slaves';
const KULI_CONFIG = cwd + 'kuli.json';

if (process.argv[process.argv.length - 1] === "init") {
	if (!fs.existsSync(KULI_CONFIG)) {
		fs.writeFileSync(KULI_CONFIG, JSON.stringify({
			ENV: {},
			slaves: {
				brick: {
					src: "https://raw.githubusercontent.com/laborci/slaves/master/brick",
					arguments: {}
				}
			}
		}, null, '\t'));
		terminal.green("Kuli initialized")("\n");
	} else {
		terminal.red("Kuli already initialized")("\n");
	}
}

try {
	fs.accessSync(KULI_CONFIG, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
	terminal.red('First do "kuli init"!')("\n");
	process.exit();
}

try {
	fs.accessSync(KULI_SLAVES, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
	fs.mkdirSync(KULI_SLAVES);
	fs.writeFileSync(KULI_SLAVES + '/loc.json', "{}");
	terminal.green('slavery created')("\n");
}


// * * *  LOAD CONFIG
let config = require(KULI_CONFIG);
if (typeof config.ENV === 'object') {
	for (let env in config.ENV) if (config.ENV.hasOwnProperty(env)) {
		if (typeof config.ENV[env] === 'string') {
			config.ENV[env] = JSON.parse(fs.readFileSync(config.ENV[env], "utf-8"));
		}
	}
}


// * * *  UPDATE SLAVES
if (process.argv[process.argv.length - 1] === "update") {
	for (let name in config.slaves) {
		terminal.cyan("[" + name + "]")("\n");

		let dir = KULI_SLAVES + '/' + name;
		try {
			fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
		} catch (err) {
			terminal.green(dir + ' directory created')("\n");
			fs.mkdirSync(dir);
		}
		if (typeof config.slaves[name].src === "string") {
			let src = config.slaves[name].src;
			fs.writeFileSync(dir + '/slave.json', download(src + '/slave.json'));
			let slave = require(dir + '/slave.json')
			for (let template in slave.templates) {
				fs.writeFileSync(dir + '/' + template, download(src + '/' + template));
			}
		}
	}
	terminal.green('done')("\n");
	terminal.bell()
	process.exit();
}


// * * *  DO
if (process.argv[process.argv.length - 2] === "do") {
	let name = process.argv[process.argv.length - 1];
	let dir = KULI_SLAVES + '/' + name
	try {
		fs.accessSync(dir + '/slave.json', fs.constants.R_OK | fs.constants.W_OK);
	} catch (err) {
		terminal.red('Could not find your slave (' + name + ')')("\n");
		process.exit();
	}
	let slave = require(dir + '/slave.json');
	(async () => {
		terminal.cyan("[" + name + "]")("\n");

		let args = {"ENV": config.ENV};
		if (typeof config.slaves[name].arguments === 'object') slave.arguments = Object.assign(slave.arguments, config.slaves[name].arguments);

		for (let argument in slave.arguments) if (slave.arguments.hasOwnProperty(argument)) {
			terminal.green('"' + argument + '": ');
			if (typeof slave.arguments[argument] === 'string') {
				args[argument] = Twig.twig({data: slave.arguments[argument]}).render(args);
				terminal(args[argument]);
			} else if(slave.arguments[argument] === null) {
				args[argument] = await terminal.inputField().promise;
			} else {
				let def = ""
				if (typeof slave.arguments[argument].default === 'string') {
					def = Twig.twig({data: slave.arguments[argument].default}).render(args);
				}
				args[argument] = await terminal.inputField({default: def}).promise;
			}
			terminal("\n");
		}

		let locations = require(KULI_SLAVES + '/loc.json');
		let defaultLocation = typeof locations[name] === 'string' ? locations[name] : "";

		terminal.cyan('output folder: ');
		let location = await terminal.inputField({default: defaultLocation}).promise;
		terminal("\n");
		if (location === '') {
			terminal.red('exit');
			terminal.bell()
			process.exit();
		}

		locations[name] = location;
		fs.writeFileSync(KULI_SLAVES + '/loc.json', JSON.stringify(locations));


		fs.mkdirSync(cwd + location, {recursive: true});
		for (let template in slave.templates) if (slave.templates.hasOwnProperty(template)) {
			let output = Twig.twig({data: fs.readFileSync(dir + '/' + template, "utf8")}).render(args);
			let file = cwd + location + '/' + Twig.twig({data: slave.templates[template]}).render(args);
			terminal.green(file)("\n");
			fs.writeFileSync(file, output);
		}
		terminal.green("done")("\n");
	})().finally(() => {
		terminal.bell();
		process.exit();
	});
}

function download(url) {
	terminal("downloading " + url)("\n");
	let request = new XMLHttpRequest();
	request.open('GET', url, false);
	request.send(null);
	if (request.status === 200) {
		return request.responseText;
	}
}


//var ip = require("ip");
//var clc = require('cli-color');
//var express = require('express');
//var bodyParser = require('body-parser');
//var app = express();
//var readline = require('readline');
//var padleft = require('pad-left');
//var highlight = require('cli-highlight').highlight;
//
//var index = 0;
//var traces = [];
//var requestid = null;
//
//app.use(bodyParser.json({limit: '10mb', extended: true}))
//app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))
//
//readline.emitKeypressEvents(process.stdin);
//process.stdin.setRawMode(true);
//
//process.stdin.on('keypress', (str, key) => {
//	if(key.name === 'q' || (key.ctrl && key.name==='c')){
//		console.log('bye')
//		process.exit();
//	}else if(key.name === 'return'){
//		readline.clearLine(process.stdout, 0);
//		if(index === 0){
//			process.stdout.write("No trace\033[0G");
//		}else{
//			showtrace(index);
//		}
//	}else if(key.name === 'space'){
//		const blank = '\n'.repeat(process.stdout.rows);
//		console.log(blank);
//		readline.cursorTo(process.stdout, 0, 0);
//		readline.clearScreenDown(process.stdout);
//		console.log('- - - - - - - - - - - - - - - - - - - - - ');
//	}else if(key.name === 'up' || key.name === 'down'){
//		readline.clearLine(process.stdout, 0);
//		if(index === 0){
//			process.stdout.write("No trace\033[0G");
//		}else{
//			if(key.name === 'up' && index > 1) index--;
//			if(key.name === 'down' && index < traces.length) index++;
//			process.stdout.write("Show trace: " + index + "\033[0G");
//		}
//	}
//});
//
//app.use(bodyParser.json());
//
//app.use('/', function(req, res){
//	message(req.body);
//	res.send('thankyou');
//});
//
//
//
//var server = app.listen(8881, '127.0.0.1', () => {
//	var host = server.address().address;
//	var port = server.address().port;
//	console.log("Logtail listening at http://%s:%s", host, port);
//});
//
//function message(log){
//	var timestamp = new Date();
//
//	if(requestid !== log.request.id){
//		requestid = log.request.id;
//		console.log(
//			"\n" +
//			styles.header.time(
//				padleft(timestamp.getHours(), 2, '0') + ':' +
//				padleft(timestamp.getMinutes(), 2, '0') + ':' +
//				padleft(timestamp.getSeconds(), 2, '0')
//			) + ' ' +
//			styles.header.method('[' + log.request.method + ']') + ' ' +
//			styles.header.path(log.request.path) + ' ' +
//			styles.header.host(log.request.host) + ' ' +
//			styles.header.host('('+log.request.id+')')
//		);
//	}
//	if(log.type == 'error' || log.type == 'exception') errorlog(log.message);
//	else if(log.type == 'sql') sqlLog(log.message);
//	else console.log(clc.cyan('[info] ') + highlight(JSON.stringify(log.message, null, 2), {language: 'json'}));
//}
//
//function sqlLog(message){
//	console.log(
//		clc.blue('[SQL]: ') + highlight(message, {language: 'sql', ignoreIllegals: true})
//	);
//}
//
//function errorlog(message){
//
//	var trace = '';
//	message.trace.forEach((trc, index) => {
//		trace +=
//			styles.trace.index('[' + index + '] ') +
//			(typeof styles.class !=='undefined' ? styles.trace.class(trc.class) : '')+
//			(typeof styles.trace !=='undefined' ? styles.trace.type(trc.type) : '')+
//			styles.trace.function(trc.function) +
//			' @' + trc.line + '' + "\n";
//
//		if(Array.isArray(trc.args) && trc.args.length) trace += highlight(JSON.stringify(trc.args, null, 2), {language: 'json'}) + "\n";
//	});
//
//	traces.push(trace);
//	index = traces.length;
//
//	traceno = traces.length;
//
//	type = message.errorlevel ? message.errorlevel : message.type;
//	console.log(
//		clc.red.bold.blink('[' + type + '] ') +
//		clc.cyan(message.file) + ' @' +
//		message.line +
//		clc.blue(' (trace#' + traceno + ')')
//	);
//	console.log(message.message);
//}
//
//function showtrace(number){
//	console.log(clc.blue(' (trace#' + number + ')'));
//	console.log(traces[number - 1]);
//}
//
//var styles = {
//	header: {
//		time  : clc.white.bold,
//		host  : clc.blackBright,
//		method: clc.green.bold,
//		path  : clc.blue
//	},
//	trace : {
//		index   : clc.blackBright,
//		class   : clc.cyan,
//		type    : clc.white,
//		function: clc.green
//	}
//};