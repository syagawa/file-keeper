# file-keeper is Watch And Copy files

Watch a file and copy at every time of saving a file.

Every time the file is saved, it is copied to the specified directory and the file name has datetime or serial number.

## Usage

require Node.js

1. install

```bash
$ npm install -g file-keeper
```

2. develop

Move to the directory containing the file you want to copy.

Example: 
  `/home/xxx/xxx.psd`

```bash
$ cd /home/xxx

# start watch
$ file-keeper
## Note: 'dist/' directory is created in '/home/xxx/'

# end watch
## `Ctrl + C`
```