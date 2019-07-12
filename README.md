# watcpy is Watch And Copy files

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

```bash
# make working directory
$ mkdir ws
```

Put the file you want to copy into `ws`

Example: 
  `xxx.psd`

```bash
# start watch
$ node main.js --ext=psd --ddir=dist --wdir=ws

# end watch
## `Ctrl + C`
```