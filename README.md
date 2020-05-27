# Kuli

Kuli is your super-simple, configurable boilderplate builder tool, based on twig engine that allows you to define your templates (slaves) in your project or download those from any http repository. 

Use Kuli to save tons of time and brain capacity for yourself. Be smart and let him do your dirty work... 


## Install

```
npm install -g kuli
```

## Init project

Run the following command in your project's root folder.

```
kuli init
```

By that you can initialize Kuli which creates the `kuli.json` file and `.kuli-slaves` folder for your project. While you can controll Kuli through `kuli.json`, it stores your templates in the `.kuli-slaves` folder.


## kuli.json

Configuring Kuli is a piece of cake. The configuration file is that simple. 

```json
{
	"slaves": {
		"brick": {
			"src": "https://raw.githubusercontent.com/laborci/slaves/master/brick",
			"arguments": {}
		}
	},
	"ENV": {}
}
```

### slaves

Definition of your slaves. If you define `src` property for your slave that will download it from that location. You can also override the slave's `arguments` here. At the example you have only one slave defined.

### ENV

You can load or define environment variables here

```json
{
	"slaves": {},
	"ENV": {
		"env" : "load-this-file.json",
		"my-env": {
			"my-first-key": "my-first-value",
			"my-second-key": "my-second-value"
		}
	}
}
```

At the example above `env` will be loaded, `my-env` will contain the values you presented. You can use this under the `ENV` key in your twigs.

## Do the job

Kuli is your hard working buddy. If you want him to do the job you just need to use the `do` command and add the name of the slave you need him to get cracking with.

```
kuli do brick
```

## Creating a slave

All slave must contain a `slave.json` file. That is the descriptor of your slave.

```json
{
	"arguments": {
		"name": {},
		"tag": {"default": "{{name}}"},
		"class": "{{name|pascalCase}}"
	},
	"templates": {
		"brick.js.twig": "{{name}}.brick.js",
		"scss.twig": "{{name}}.scss",
		"twig.twig": "{{name}}.twig"
	}
}
```

### Arguments

You can define your arguments in the `arguments` section. All values you define will be small twig fragments. All the `ENV` variables or previously defined arguments can be used here.

#### string

If the value is a `string` then it will be used but not asked. Just like the `class` argument above. 

#### null

If it is an `empty object` (or `null`) your attribute will not have a default value.

#### default

If you define a `default` property here, Kuli will use that as a default value for that attribute.

### Templates

In this section you can define your template files. The key is the twig template file, the value is the desired file name of the output file.

While rendering the template files you can access all `ENV` and `attribute` values. You should not refer `ENV` values directly, it is much better to pipe environment values through attributes.


### Twig case filters

- camelCase
- capitalCase
- constantCase
- dotCase
- headerCase
- noCase
- paramCase
- pascalCase
- pathCase
- sentenceCase
- snakeCase