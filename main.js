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
const cache2 = {};

const st = require("./settings.js")(argv);

updateNotify();

let logger;

const modes = {
  datetime: {
    format: function(detail){
      const now = new Date();
      const filename = detail.filename;
      const formatted = dateFormat(now, "yyyymmdd_HHMMss");
      if(cache[filename]){
        cache[filename].number += 1;
      }else{
        cache[filename] = { number: 1 };
      }
      return formatted;
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
        const m = current.match("\_\[\\d\]{" + st.num_pad + "}.*\$");
        number = Number(m[0].replace(/^_/, "").replace(/\..*$/, ""));
      }
      number++;

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

function saveCache(filename, obj){
  const c = cache2;
  const keys = Object.keys(obj);
  keys.forEach(function(k){
    if(!c[k]){
      c[k] = [];
    }
    c[k].push(obj[k]);
  });
}

function walkDir(p, filecb, errcb){
  const files = fs.readdirSync(p);
  files.forEach(function(f){
    if(!f){
      errcb();
      return;
    }
    const fpath = path.join(p, f);
    if(fs.statSync(fpath).isDirectory()){
      walkDir(fpath, filecb);
    }else{
      filecb(fpath);
    }
  });
}

function setInitialFiles(){
  let counter = 0;
  const initials = {};
  return new Promise(function(resolve, reject){
    walkDir(cwd, function(f) {
      const relative_path = path.relative(cwd, f);
      if(!isTargetFile(relative_path)){
        return;
      }
      if(st.exts.includes(path.extname(f))){
        initials[f] = true;
      }
      counter++;
    }, function(err) {
      console.log("Receive err:" + err);
      reject();
    });
    resolve(initials);
  });
}

function isInitialFile(p){
  if(st.initials[p]){
    return true;
  }
  return false;
}

async function startWatch(working_dir, dist_dir, exts){
  if(st.only_update){
    st.initials = await setInitialFiles();
    const initials_length = Object.keys(st.initials).length;
    if(initials_length === 0){
      displayFirstMessage("notargetfile");
      process.exit(1);
      return;
    }
  }

  const watcher = chokidar.watch(
    working_dir,
    {
      ignored:  new RegExp("node_modules\/.*|.git|" + dist_dir)
    })
    .on("ready", async function(){
      // console.log("ready",watcher.getWatched());
    })
    .on("add", function(filepath, p){
      afterUpdate(filepath, p, exts, { message: "Target file added" });
    })
    .on("change", function(filepath, p){
      afterUpdate(filepath, p, exts, { message: "Updated" });
    });

  displayFirstMessage();

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

function isFirstDegree(filepath){
  const dir = path.dirname(filepath);
  if(dir === st.working_dir){
    return true;
  }
}

function isTargetFile(filepath){
  if(isFileInDist(filepath)){
    return false;
  }
  if(!st.recursive && !isFirstDegree(filepath)){
    return false;
  }
  return true;
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

function isCacheLimitExceeded(detail){
  const len = Object.keys(cache).length;
  if(len >= st.max_watch_file_count){
    const filename = detail.filename;
    if(!cache[filename]){
      return true;
    }
  }
  return false;
}

function afterUpdate(filepath, p, exts, obj){

  if(!isTargetFile(filepath)){
    return;
  }

  const fullpath = path.join(cwd, filepath);
  if(st.only_update && !isInitialFile(fullpath)){
    return false;
  }

  const filedetail = getFileDetail(filepath, p);
  if(exts.includes(filedetail.ename)){
    logger.info( obj.message + ": " + path.join(cwd, filepath,));
    if(isCacheLimitExceeded(filedetail)){
      logger.warn(`The maximum number of files that can be watched is ${st.max_watch_file_count}`);
      return;
    }
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

function displayFirstMessage(type){
    logger.info(`Modes`);
    logger.info(`-- Save file mode: ${st.mode}`);
    logger.info(`-- Extensions of target file: ${st.exts.join(" ")}`);
    logger.info(`-- Target directory: ${path.join(cwd,st.working_dir)}`);
    logger.info(`-- Distribution directory: ${path.join(cwd, st.dist_dir)}`);
    logger.info(`-- Recursive: ${st.recursive}`);
    logger.info(`-- Only update: ${st.only_update}`);
    if(type === "notargetfile"){
      logger.warn("No target file. exit...");
    }else{
      logger.info(`Start ${pkg.name} version: ${pkg.version} !!`);
    }
}

function run(){

  if(st.is_save_log_file){
    log4js.configure(st.log_settings.console_and_logfile);
  }else{
    log4js.configure(st.log_settings.only_console);
  }
  logger = log4js.getLogger("file-keeper");


  if(st.working_dir === st.dist_dir){
    logger.warn(`Working directory and Distribution directory are the same path! ${st.working_dir}, ${st.dist_dir}`);
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

}

module.exports = run;