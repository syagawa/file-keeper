const gulp = require("gulp");
const rename = require("gulp-rename");
const dateFormat = require("dateformat");
const watch = require("gulp-watch");

const tgt = ["ws/**/*.psd","!ws/**/_*.psd"];


function copy(p){
  const file = p.path;
  return gulp.src(file)
      .pipe(rename(function(path){
        const now = new Date();
        path.basename += "_" + dateFormat(now, "yyyymmdd_HHMMss");
        console.log("FileName: " + path.basename);
      }))
      .pipe(gulp.dest("dist"));
}

function watchFile(){
  return watch(tgt, function(p){ return copy(p); });
}

const start = gulp.parallel(watchFile);
gulp.task("start", start);

exports.default = start;