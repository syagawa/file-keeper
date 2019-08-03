const chokidar = require("chokidar");
const dateFormat = require("dateformat");
const fs = require("fs");
const argv = require("yargs").argv;
const path = require("path");
const log4js = require("log4js");
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

const cwd = process.cwd();
const cache = {};

const st = require("./settings.js")(argv);

updateNotify();

const logger = log4js.getLogger("file-keeper");
logger.level = "debug";

logger.info("Target Files: " + st.exts.join(" "));
logger.info(path.join(cwd,st.working_dir));
logger.info(path.join(cwd, st.dist_dir));

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
      const files = fs.readdirSync(path.join(cwd, st.dist_dir));
      const list = files.filter(function(f){
        return new RegExp("^" + filename + "\_\\d{" + st.num_pad + "}" + detail.ename + "$").test(f);
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
        const m = current.match("\_\[\\d\]{" + st.num_pad + "}.*\$");
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
      const str = String(number).padStart(st.num_pad, 0);
      cache[filename].number = number;
      return str;
    }
  }
};

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
  let reg = new RegExp("^" + st.dist_dir);
  if(reg.test(filepath)){
    return true;
  }
  return false;
}
function isChildInWorkingDir(filepath){
  const dir = path.dirname(filepath);
  if(dir === st.working_dir){
    return true;
  }
}


function copy(detail, dir){
  const newname = detail.filename + "_" + modes[st.mode].format(detail) + detail.ename;
  try{
    fs.copyFileSync(detail.filepath, path.join(dir, newname) );
  }catch(e){
    logger.error("Can't Copy: " + path.join(cwd, st.dist_dir, newname));
  }

  logger.info("Copied: " + path.join(cwd, st.dist_dir, newname));
}

function afterUpdate(filepath, p, exts, obj){
  if(isFileInDist(filepath)){
    return;
  }
  if(!st.recursive && !isChildInWorkingDir(filepath)){
    return;
  }

  const filedetail = getFileDetail(filepath, p);
  if(exts.includes(filedetail.ename)){
    logger.info( obj.message + ": " + path.join(cwd, filepath,));
    copy(filedetail, st.dist_dir);
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

function updateNotify(){
  const notifier = updateNotifier({
    pkg
  });

  const res = notifier.notify({
    isGlobal: true,
    boxenOpts: {padding: 1, margin: 1, align: 'center', borderColor: 'yellow', borderStyle: 'round'}
  });
  if(notifier.update){
    console.log(`Update available ${notifier.update.current} -> ${notifier.update.latest} Run npm i -g ${notifier.update.name} to update`);
  }

}

function run(){

  if(st.working_dir === st.dist_dir){
    logger.warn("Working directory and Dist directory are the same path! " + st.working_dir + ", " + st.dist_dir);
    logger.warn("exit");
    process.exit(1);
  }

  if(!fs.existsSync(st.working_dir)){
    fs.mkdirSync(st.working_dir);
  }

  if(!fs.existsSync(st.dist_dir)){
    fs.mkdirSync(st.dist_dir);
  }

  if(st.clean_before_start){
    logger.info("Clean! before Start");
    cleanDirectory(st.dist_dir);
  }

  startWatch(st.working_dir, st.dist_dir, st.exts);
  logger.info(`Start ${pkg.name} version: ${pkg.version} !!`);

}

module.exports = run;