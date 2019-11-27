import express from "express";
import { Options } from "range-parser";
var app = express();

// Routing
var path = require('path');
var statsRouter = require('./routes/stats');
var errorRouter = require('./routes/error');
var imageRouter = require('./routes/images');

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../src/views'));

// File system info
var fs = require('fs');

var origFilesNum = 0;
var resFilesNum = 0;
var cacheHits = 0;
var cacheMisses = 0;
var additionalInfo = "To add";

function refreshStats() {
  fs.readdir(path.join(__dirname, '/../images'), (err: NodeJS.ErrnoException, files: string[]) => {
    origFilesNum = files.length;
  });

  /* depends on actual resize ops/cache
  fs.readdir(path.join(__dirname, '/../images/resized'), (err: NodeJS.ErrnoException, files: string[]) => {
    resFilesNum = files.length;
  });  */
  // TODO Cache hits
  // TODO Cache Misses
  // TODO Additional Info

  app.set('origFilesNum', origFilesNum.toString());
  app.set('resFilesNum', resFilesNum.toString());
  app.set('cacheHits', cacheHits.toString());
  app.set('cacheMisses', cacheMisses.toString());
  app.set('additionalInfo', additionalInfo.toString());
}
refreshStats(); // Initial call;

app.use('/stats', function (req, res, next) {
  next();
}, statsRouter);

var ms = 1000;
setInterval(refreshStats, ms); // refreshes or stats; then again a task schedule like agendajs might do a better job

app.use(express.static(path.join(__dirname, '../images')));
app.use('/image', imageRouter);

/* Fallback case*/
app.all('/*', function(req, res, next) {
  res.send("You've reached a wrong place; try getting stats or images instead!");
  next();
});

// catch 404 and forward to error handler
var createError = require('http-errors');
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  app.use('/error', errorRouter);
});

module.exports = app;
