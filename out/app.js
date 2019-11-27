"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var app = express_1.default();
var path = require('path');
var statsRouter = require('./routes/stats');
var errorRouter = require('./routes/error');
var imageRouter = require('./routes/images');
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../src/views'));
var fs = require('fs');
var origFilesNum = 0;
var resFilesNum = 0;
var cacheHits = 0;
var cacheMisses = 0;
var additionalInfo = "To add";
function refreshStats() {
    fs.readdir(path.join(__dirname, '/../images'), (err, files) => {
        origFilesNum = files.length;
    });
    app.set('origFilesNum', origFilesNum.toString());
    app.set('resFilesNum', resFilesNum.toString());
    app.set('cacheHits', cacheHits.toString());
    app.set('cacheMisses', cacheMisses.toString());
    app.set('additionalInfo', additionalInfo.toString());
}
refreshStats();
app.use('/stats', function (req, res, next) {
    next();
}, statsRouter);
var ms = 1000;
setInterval(refreshStats, ms);
app.use(express_1.default.static(path.join(__dirname, '../images')));
app.use('/image', imageRouter);
app.all('/*', function (req, res, next) {
    res.send("You've reached a wrong place; try getting stats or images instead!");
    next();
});
var createError = require('http-errors');
app.use(function (req, res, next) {
    next(createError(404));
});
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    app.use('/error', errorRouter);
});
module.exports = app;
//# sourceMappingURL=app.js.map