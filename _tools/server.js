const express = require('express');
const path = require('path');
const fs = require('fs');


const gulp = require('gulp');
const plumber = require('gulp-plumber');
const gulp_ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const gulp_notify = require('gulp-notify');
const gulp_filter = require('gulp-filter');
const gulp_concat = require("gulp-concat");
const gulp_babel = require("gulp-babel");
const obnizVersion = require("./obnizVersion");
const gulp_yaml = require("gulp-yaml");
const concatWith = require("./concatWith");
const gulp_sort = require("gulp-sort");
const docGenerator = require("./wsDocGenerator");



const app = express();
const port = 3100;

app.get('/', (request, response) => {
  response.send('Hello from Express!')
});

app.get('/obniz.js', (request, response) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.sendFile(path.join(__dirname, '../obniz.js'));
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
});




const obnizPath = path.join(__dirname, '../obniz/**/*.js');
const partsPath = path.join(__dirname, '../parts/**/*.js');
const packageJsonPath = path.join(__dirname, '../package.json');
const wsroomSchemaSrcPath = path.join(__dirname, '../../wsroom/json_schema/**/*.yml');
const schemaSrcPath = path.join(__dirname, '../json_schema/**/*.yml');
const tempPath = path.join(__dirname, "../temp");
const tv4Path = require.resolve("tv4", {path:path.resolve(__dirname,"../")});
if(!tv4Path){
  throw new Error("tv4 not found.npm install please")
}

if(!fs.existsSync(tempPath)){
  fs.mkdirSync(tempPath);
}



gulp.task("jsonSchemaJoin", function jsonSchemaForVar(){
  return gulp.src(schemaSrcPath)
      .pipe(plumber({errorHandler: reportError}))
      .pipe(gulp_sort())
      .pipe(gulp_yaml({ safe: true }))
      .pipe(concatWith("schema.js",{header:"let wsSchema = [", separator:",", footer:"];" }))
      .pipe(gulp.dest(tempPath))
      .pipe(docGenerator())
      .pipe(rename("schema.md"))
      .pipe(gulp.dest(__dirname));

});


gulp.task("packageJsonConvert", function packageJsonConvert(){
  return gulp.src(packageJsonPath)
      .pipe(plumber({errorHandler: reportError}))
      .pipe(obnizVersion())
      .pipe(rename("obnizVersion.js"))
      .pipe(gulp.dest(tempPath));
});


//順番が関係あるので予めやる
gulp.task("partsJoin", function partsJoin(){
  return gulp.src(partsPath)
      .pipe(plumber({errorHandler: reportError}))
      .pipe(gulp_sort())
      .pipe(gulp_concat("obnizParts.js"))
      .pipe(gulp.dest(tempPath));
});


//順番が関係あるので予めやる
gulp.task("obnizMain", function partsJoin(){
  return gulp.src(obnizPath)
      .pipe(plumber({errorHandler: reportError}))
      .pipe(gulp_sort())
      .pipe(gulp_concat("obnizMain.js"))
      .pipe(gulp.dest(tempPath));
});


gulp.task("tv4Wrap", ["jsonSchemaJoin"], function tv4Wrap(){
  let header = "(function(global){ let module = {exports:{}};";
  let separator = "\n";
  let footer = "; \n Obniz.tv4 = module.exports; wsSchema.map(Obniz.tv4.addSchema) })(this);";

  return gulp.src([tv4Path, path.join(tempPath,"schema.js")])
      .pipe(plumber({errorHandler: reportError}))
      .pipe(concatWith("tv4Wraped.js",{header,separator, footer}))
      .pipe(gulp.dest(tempPath));
});


gulp.task("obniz.js", ["obnizMain","packageJsonConvert","partsJoin", "tv4Wrap"] ,function obnizJsBuild(){



  let obnizjsSrcPaths = [
    path.join(tempPath,"obnizVersion.js"),
    path.join(tempPath,"obnizMain.js"),
    path.join(tempPath,"obnizParts.js"),
    path.join(tempPath,"schema.js"),
    path.join(tempPath,"tv4Wraped.js"),
  ];
  return  gulp.src(obnizjsSrcPaths)
      .pipe(plumber({errorHandler: reportError}))
      .pipe(gulp_concat("obniz.js"))
      .pipe(gulp.dest(path.join(__dirname, '../')))

      .pipe(gulp_babel({
        "presets": [
          ["env", {"targets": {"node": "6.10"}}]
        ]
      }))
      .pipe(rename("obniz.node6_10.js"))
      .pipe(gulp.dest(path.join(__dirname, '../')))
      .on('end', function(){ console.log('obniz.js compiled!'); });
});

gulp.run("obniz.js");


gulp.watch([obnizPath,partsPath,packageJsonPath,schemaSrcPath], ["obniz.js"]);




function readMeBuild() {
  return gulp.src(path.join(partsPath, '/**/README.ejs'))
      .pipe(plumber({errorHandler: reportError}))
      .pipe(gulp_ejs())
      .pipe(rename({extname: '.md'}))
      .pipe(gulp.dest(partsPath))
      .on('end', function(){ console.log('ejs compiled!'); });
}

gulp.watch(path.join(partsPath, '/**/README.ejs'), readMeBuild);
readMeBuild();


function reportError(error) {
  let lineNumber = (error.lineNumber) ? 'LINE ' + error.lineNumber + ' -- ' : '';

  gulp_notify({
    title: 'Task Failed [' + error.plugin + ']',
    message: lineNumber + 'See console.',
    sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
  }).write(error);

  let report = '';
  report += 'TASK:' + ' [' + error.plugin + ']\n';
  report += 'MESSAGE:' + ' ' + error.message + '\n';
  if (error.fileName)   { report += 'FILE:' + ' ' + error.fileName + '\n'; }
  if (error.lineNumber) { report += 'LINE:' + ' ' + error.lineNumber + '\n'; }
  console.error(report);

}
