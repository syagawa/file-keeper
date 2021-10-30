const makeObj = function(argv){
  return {
    argv: argv,
    get working_dir(){
      if(this.argv.wdir){
        return argv.wdir;
      }else{
        return ".";
      }
    },
    get dist_dir(){
      if(this.argv.ddir){
        return argv.ddir;
      }else{
        return "dist";
      }
    },
    get exc(){
      if(this.argv.exc){
        return argv.exc.split(",");
      }else{
        return [];
      }
    },
    get exts(){
      if(this.argv.exts){
        return argv.exts.split(",");
      }else{
        return [
          ".psd",
          ".ai",
          ".xd",
          ".sketch",
          ".xls",
          ".xlsx",
          ".doc",
          ".docx"
        ];
      }
    },
    get num_pad(){
      if(argv.numpad){
        let num = Number(argv.numpad);
        if(Number.isInteger(num)){
          if(num > this.max_num_pad){
            num = this.max_num_pad;
          }
          return num;
        }
      }
      return 5;
    },
    get max_num_pad(){
      return 20;
    },
    get mode(){
      let res = "datetime";
      if(argv.number || argv.mode === "number" || argv.n){
        res = "number";
      }
      if(argv.datetime || argv.mode === "datetime"){
        res = "datetime";
      }
      return res;
    },
    get recursive(){
      if(argv.recursive || argv.r){
        return true;
      }
      return false;
    },
    get clean_before_start(){
      if(argv.clean || argv.c){
        return true;
      }
      return false;
    },
    get max_watch_file_count(){
      return 100;
    },
    get only_update(){
      if(this.argv.onlyupdate || this.argv.noadd || this.argv.u){
        return true;
      }
      return false;
    },
    get interval(){
      if(this.argv.interval){
        const ms = Number(this.argv.interval);
        if(isNaN(ms)){
          return 0;
        }
        return ms;
      }
      return 0;
    },
    get is_save_log_file(){
      if(this.argv["save-log"]){
        return true;
      }
      if(this.argv["save-logs"]){
        return true;
      }
      return false;
    },
    get show_version(){
      if(this.argv["show-version"]){
        return true;
      }
      return false;
    },
    get show_help(){
      if(this.argv["show-help"]){
        return true;
      }
      return false;
    },
    log_settings:{
      only_console:{
        "appenders": { 
          console: { type: "console" }
        },
        "categories": { default: { appenders: ["console"], level: "debug" } }
      },
      console_and_logfile: {
        "appenders": { 
          log: { type: "file", filename: "./file-keeper.log" },
          console: { type: "console" }
        },
        "categories": { default: { appenders: ["log", "console"], level: "debug" } }
      }
    },
    initials: {}
  };
};

module.exports = makeObj;
