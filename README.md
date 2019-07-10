# Watch And Copy files

## Usage

1. download & install

```bash
$ git clone <this.repository>

$ cd <this.repository>

## Change name and author, description, etc... in package.json

$ npm install

$ npm install -g gulp@4.0.2

```

2. develop

```bash
# make working directory
$ mkdir ws
```

Put the file you want to copy into `ws`

Example: 
  `xxx.psd`

```bash
# start watch
$ gulp --ext=psd --ddir=dist --wdir=ws

# end watch
## `Ctrl + C`
```