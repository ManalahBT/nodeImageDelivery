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
app.set('views', path.join(__dirname, '../../src/views'));
app.set('origFilesNum', 0);
app.set('resFilesNum', 0);
app.set('cacheHits', 0);
app.set('cacheMisses', 0);
app.set('totalNumberOfCachedFiles', 0);
app.set('totalLengthOfCachedFiles', 0);
var fs = require('fs');
function refreshStats() {
    fs.readdir(path.join(__dirname, '/../../images'), (err, files) => {
        app.set('origFilesNum', files.length);
    });
}
refreshStats();
var ms = 1000;
setInterval(refreshStats, ms);
app.use(express_1.default.static(path.join(__dirname, '../../images')));
app.use('/stats', statsRouter);
app.use('/image', imageRouter);
app.use('/error', errorRouter);
var createError = require('http-errors');
app.use(function (req, res, next) {
    next(createError(500));
});
app.use(function (err, req, res, next) {
    res.redirect(err.status || 500, '/error');
});
module.exports = app;
//# sourceMappingURL=app.js.map