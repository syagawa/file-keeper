const chokidar = require("chokidar");
const dateFormat = require("dateformat");
const fs = require("fs");
const argv = require("yargs").argv;
const path = require("path");
const log4js = require("log4js");

const cwd = process.cwd();
const cache = {};

let working_dir = ".";
let dist_dir = "dist";
let exts = [
  ".psd",
  ".ai",
  ".xls",
  ".xlsx",
  ".doc",
  ".docx"
];
let num_pad = 5;
const max_num_pad = 20;
let mode = "datetime";
let clean_before_start = false;

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
if(argv.numpad){
  let num = Number(argv.numpad);
  if(Number.isInteger(num)){
    if(num > max_num_pad){
      num = max_num_pad;
    }
    num_pad = num;
  }
}
if(argv.clean){
  clean_before_start = true;
}

const logger = log4js.getLogger("file-keeper");
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
        return new RegExp("^" + filename + "\_\\d{" + num_pad + "}" + detail.ename + "$").test(f);
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
        const m = current.match("\_\[\\d\]{" + num_pad + "}.*\$");
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
      const str = String(number).padStart(num_pad, 0);
      cache[filename].number = number;
      return str;
    }
  }
};

function run(){

  if(working_dir === dist_dir){
    logger.warn("Working directory and Dist directory are the same path! " + working_dir + ", " + dist_dir);
    logger.warn("exit");
    process.exit(1);
  }

  if(!fs.existsSync(working_dir)){
    fs.mkdirSync(working_dir);
  }

  if(!fs.existsSync(dist_dir)){
    fs.mkdirSync(dist_dir);
  }

  if(clean_before_start){
    logger.info("Clean! before Start");
    cleanDirectory(dist_dir);
  }

  startWatch(working_dir, dist_dir, exts);
  logger.info("Start !!");

}

function startWatch(working_dir, dist_dir, exts){
  chokidar.watch(
    working_dir,
    {
      ignored:  new RegExp("node_modules\/.*|.git|" + dist_dir)
    })
    .on("add", function(filepath, p){
      // console.log("add", filepath, p);
      afterUpdate(filepath, p, exts, { message: "Added" });
    })
    .on("change", function(filepath, p){
      // console.log("change", filepath, p);
      afterUpdate(filepath, p, exts, { message: "Updated" });
    });
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

function isFileInDist(filepath){
  let reg = new RegExp("^" + dist_dir);
  if(reg.test(filepath)){
    return true;
  }
  return false;
}

function copy(detail, dir){
  const newname = detail.filename + "_" + modes[mode].format(detail) + detail.ename;
  try{
    fs.copyFileSync(detail.filepath, path.join(dir, newname) );
  }catch(e){
    logger.error("Can't Copy: " + path.join(cwd, dist_dir, newname));
  }

  logger.info("Copied: " + path.join(cwd, dist_dir, newname));
}

function afterUpdate(filepath, p, exts, obj){
  if(isFileInDist(filepath)){
    return;
  }
  const filedetail = getFileDetail(filepath, p);
  // console.log(filedetail);
  // console.log("exts", exts);
  if(exts.includes(filedetail.ename)){
    logger.info( obj.message + ": " + path.join(cwd, filepath,));
    copy(filedetail, dist_dir);
  }
}

function cleanDirectory(p){
  const files = fs.readdirSync(p);
  files.forEach(function(elm){
    const file = path.join(p,elm);
    if(fs.statSync(file).isFile()){
      fs.unlinkSync(file);
      logger.info("Remove: " + file);
    }
  });
}

module.exports = run;