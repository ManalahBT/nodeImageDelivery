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

//TODO add actual stats
app.set('origFilesNum', 0); //TODO remove done
app.set('resFilesNum', 0);
app.set('cacheHits', 0);
app.set('cacheMisses', 0);
app.set('totalNumberOfCachedFiles', 0);
app.set('totalLengthOfCachedFiles', 0);

//TODO check adding files while app works!
function refreshStats() {
  fs.readdir(path.join(__dirname, '/../images'), (err: NodeJS.ErrnoException, files: string[]) => {
    app.set('origFilesNum', files.length);
  });

  // TODO Cache hits
  // TODO Cache Misses
  // TODO Resized Files
  // TODO Additional Info
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
