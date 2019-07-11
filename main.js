const chokidar = require("chokidar");
const dateFormat = require("dateformat");
const fs = require("fs");
const argv = require("yargs").argv;
const path = require("path");
const log4js = require("log4js");

const cwd = process.cwd();
const cache = {};

let working_dir = "ws";
let dist_dir = "dist";
let exts = [
  ".psd",
  ".ai",
  ".xls",
  ".xlsx",
  ".doc",
  ".docx"
];
let numPad = 5;
let mode = "datetime";

if(argv.mode === "number"){
  mode = "number";
}
if(argv.exts){
  exts = argv.exts.split(",");
}
if(argv.wdir){
  working_dir = argv.wdir;
}
if(argv.ddir){
  dist_dir = argv.ddir;
}

const logger = log4js.getLogger("watch-copy");
logger.level = "debug";

logger.info("Target Files: " + exts.join(" "));
logger.info(path.join(cwd, working_dir));
logger.info(path.join(cwd, dist_dir));

const modes = {
  datetime: {
    format: function(detail){
      const now = new Date();
      return dateFormat(now, "yyyymmdd_HHMMss");
    }
  },
  number: {
    format: function(detail){
      let number = 0;
      const filename = detail.filename;
      const files = fs.readdirSync(path.join(cwd, dist_dir));
      const list = files.filter(function(f){
        return new RegExp("^" + filename + "\_\\d{" + numPad + "}" + detail.ename + "$").test(f);
      });
      // console.log("list", list);
      if(list.length !== 0){
        list.sort(function(a, b){
          if (a < b) {
             return -1;
          }
          if (a > b) {
             return 1;
          }
          return 0;
        });

        const current = list[list.length - 1];
        // const m = current.match(/\_[\d]{0,5}$/);
        const m = current.match("\_\[\\d\]{" + numPad + "}.*\$");
        // console.log("current", current);
        number = Number(m[0].replace(/^_/, "").replace(/\..*$/, ""));
        number++;
      }else{
        number++;
      }

      if(cache[filename]){
        cache[filename].number = number;
      }else{
        cache[filename] = { number: number };
      }
      const str = String(number).padStart(5, 0);
      cache[filename].number = number;
      return str;
    }
  }
};

function init(){
  if(!fs.existsSync(working_dir)){
    fs.mkdirSync(working_dir);
  }

  if(!fs.existsSync(dist_dir)){
    fs.mkdirSync(dist_dir);
  }
  logger.info("Start !!");
}

function getFileDetail(filepath){
  const base = path.basename(filepath);
  const filename = base.replace(/(.*)\..*$/,"$1");
  const ename = path.extname(filepath);
  return {
    dirname: path.dirname(filepath),
    ename: ename,
    filename: filename,
    filepath: filepath
  };
}

function copy(detail, dir){
  const newname = detail.filename + "_" + modes[mode].format(detail) + detail.ename;
  fs.copyFileSync(detail.filepath, path.join(dir, newname) );
  logger.info("Copied: " + path.join(cwd, dist_dir, newname));
}

function afterUpdate(filepath, p, exts){
  const filedetail = getFileDetail(filepath, p);
  // console.log(filedetail);
  // console.log("exts", exts);
  if(exts.includes(filedetail.ename)){
    logger.info("Added or Updated: " + path.join(cwd, filepath,));
    copy(filedetail, dist_dir);
  }
}


chokidar.watch(
  working_dir,
  {
    ignored:  /node_modules\/.*|.git/
  })
  .on("add", function(filepath, p){
    // console.log("add", filepath, p);
    afterUpdate(filepath, p, exts);
  })
  .on("change", function(filepath, p){
    // console.log("change", filepath, p);
    afterUpdate(filepath, p, exts);
  });

init();

