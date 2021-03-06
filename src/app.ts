import express from "express";
import path from "path";
import fs from "fs";
var app = express();

// Routing
var statsRouter = require('./routes/stats');
var errorRouter = require('./routes/error');
var imageRouter = require('./routes/images');

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../../src/views'));

// TODO sync across worker clusters
app.set('origFilesNum', 0);
app.set('resFilesNum', 0);
app.set('cacheHits', 0);
app.set('cacheMisses', 0);
app.set('totalNumberOfCachedFiles', 0);
app.set('totalLengthOfCachedFiles', 0);

// File system info
function refreshStats() {
  fs.readdir(path.join(__dirname, '/../../images'), (err: NodeJS.ErrnoException | null, files: string[]) => {
    app.set('origFilesNum', files.length);
  });
}
refreshStats(); // Initial call;

var ms = 1000;
setInterval(refreshStats, ms); // refreshes or stats; then again a task scheduler like agendajs might do a better job

app.use(express.static(path.join(__dirname, '../../images')));  // static asset access

app.use('/', statsRouter);  // default to stats
app.use('/stats', statsRouter);
app.use('/image', imageRouter);
app.use('/error', errorRouter);

// catch 500 and forward to error handler
var createError = require('http-errors');
app.use(function (req, res, next) {
  next(createError(500));
});

// error handler
app.use(function (err: any, req: any, res: any, next: any) {
  // render the error page
  res.redirect(err.status || 500, '/error');
});

module.exports = app;
