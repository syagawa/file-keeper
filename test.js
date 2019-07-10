const chokidar = require("chokidar");

chokidar.watch(
  ".",
  {
    // ignored:  /(^|[\/\\])\../,
    ignored:  /node_modules|.git/,
    cwd: '.'
  })
  .on("add", function(evt, path){
    console.log(evt, path);
  })
  .on("change", function(evt, path){
    console.log(evt, path);
  });