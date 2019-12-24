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

## Command Options

**Consecutive Number**

Output files in consecutive number.

```bash
$ file-keeper -n
  or
$ file-keeper --number
  or
$ file-keeper --mode=number
```

**File Type**

You can specify the target file.
If you do not add an option, watch default ".psd", ".ai", ".xls", ".xlsx", ".doc", ".docx".

```bash
# Watch only .jpg files
$ file-keeper --exts=.jpg
```

**Working Directory**

Specify a working directory.

```bash
# Watch ./example_folder
$ file-keeper --wdir=example_folder
```

**Distribution Directory**

Specify a distribution directory.

```bash
# Watch ./example_folder
$ file-keeper --ddir=example_folder
```

**Clean Distribution Directory before Start**

```bash
$ file-keeper --clean
```

**Recursively watch files in lower directories**

```bash
$ file-keeper --recursive
  or
$ file-keeper -r
```


**For file updates only**

```bash
$ file-keeper --onlyupdate
  or
$ file-keeper --noadd
  or
$ file-keeper -u

```
