# file-keeper is Watch And Copy files

Watch a file and copy at every time of saving a file.

Every time the file is saved, it is copied to the specified directory and the file name has datetime or serial number.

## Usage

require Node.js

1. download & install

```bash
$ git clone <this.repository>

$ cd <this.repository>

$ npm install
```

2. develop

Put the file you want to copy into cloned diretory

Example: 
  `xxx.psd`

```bash
# start watch
$ node main.js --ext=.psd --ddir=dist

# end watch
## `Ctrl + C`
```