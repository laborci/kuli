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

let KULI_SLAVES = cwd + '.kuli-slaves';
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

let config;
let packagesjson = JSON.parse(fs.readFileSync(cwd + 'package.json'));
if(typeof packagesjson.kuli === 'object'){
	config = packagesjson.kuli;
}else{
	try {
		fs.accessSync(KULI_CONFIG, fs.constants.R_OK | fs.constants.W_OK);
		// * * *  LOAD CONFIG
		config = require(KULI_CONFIG);
		if (typeof config.ENV === 'object') {
			for (let env in config.ENV) if (config.ENV.hasOwnProperty(env)) {
				if (typeof config.ENV[env] === 'string') {
					config.ENV[env] = JSON.parse(fs.readFileSync(config.ENV[env], "utf-8"));
				}
			}
		}
	} catch (err) {
		terminal.red('First do "kuli init"!')("\n");
		process.exit();
	}
}





if(typeof config.path === "string"){
	KULI_SLAVES = cwd + config.path;
}

// * * * TRY KULI STORAGE
try {
	fs.accessSync(KULI_SLAVES, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
	fs.mkdirSync(KULI_SLAVES);
	fs.writeFileSync(KULI_SLAVES + '/loc.json', "{}");
	terminal.green('slavery created')("\n");
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
