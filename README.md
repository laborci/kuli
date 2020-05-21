# Kuli

Kuli is a simple, configurable boilderplate builder tool, based on twig engine. You can define your templates (slaves) in your project or download those from any http repository.

## Install

```
npm install -g kuli
```

## Init project

In your project's root folder run the following command

```
kuli init
```

This initilizes kuli, creates the `kuli.json` file, and `.kuli-slaves` folder in your project. While you can controll kuli throug `kuli.json`, it stores your templates in the `.kuli-slaves` folder.


## kuli.json

The kuli configuration file looks like this.

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

Definition of your slaves. If you define `src` property for your slave, it will download it from that location. You can also override the slave's `arguments` here. In the example you have only one slave defined.

### ENV

You can load or define environment variables here

```json
{
	"slaves": { ... }
	"ENV": {
		"env" : "load-this-file.json",
		"my-env": {
			"my-first-key": "my-first-value",
			"my-second-key": "my-second-value"
		}
	}
}
```

In the example above `env` will be loaded, `my-env` will contain the values you presented. You can use this under the `ENV` key in your twigs.

## Do the job

To do the job use the do command and the name of the slave you want to make work!

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

You can define your arguments in the `arguments` section. All values you define are small twig fragments, you can use all the ENV variables or previously defined arguments here.

#### string

If the value is a `string` it will be used, but not asked. Like `class` argument above. 

#### null

If its an `empty object` (or `null`) your attribute will not have a default value.

#### default

If you define a `default` property here, kuli will use it as a default value for the attribute.

### Templates

In this section you can define your template files. The key is the twig template file, the value is the desired file name for the output file.

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