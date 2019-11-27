"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const lru_cache_1 = __importDefault(require("lru-cache"));
var router = express_1.default.Router();
var cache = new lru_cache_1.default({ max: 50 * 350000,
    length: function (value, key) { return value.length; },
    dispose: function (key, value) { console.log("Deleted " + key); },
    stale: true,
    updateAgeOnGet: true,
    maxAge: 1000 * 60 * 60 });
router.get('/:id', function (req, res, next) {
    processFileAndURL(req, res, "raw");
});
router.get('/:id/page', function (req, res, next) {
    processFileAndURL(req, res, "page");
});
module.exports = router;
function processFileAndURL(req, res, mode) {
    if (mode != "page" && mode != "raw") {
        res.send('File ' + req.params.id + ' not found');
        return;
    }
    var app = req.app;
    const filePath = 'images/' + req.params.id;
    if (fs_1.default.existsSync(filePath)) {
        const image = sharp_1.default(filePath);
        if (req.query.size != undefined) {
            const ret = /^(\d+)x(\d+)$/i.exec(req.query.size);
            if (ret !== null && ret !== undefined && ret.length !== 0) {
                var reqWidth = parseInt(ret[1], 10);
                var reqHeight = parseInt(ret[2], 10);
                cacheAndForward(app, image, req, res, filePath, mode, reqWidth, reqHeight);
            }
            else {
                cacheAndForward(app, image, req, res, filePath, mode, 0, 0);
            }
        }
        else {
            cacheAndForward(app, image, req, res, filePath, mode, 0, 0);
        }
    }
    else {
        res.send('File ' + req.params.id + ' not found');
    }
}
function cacheAndForward(app, image, req, res, filePath, mode, reqWidth = 0, reqHeight = 0) {
    if (mode != "page" && mode != "raw") {
        res.send('File ' + req.params.id + ' not found');
        return;
    }
    image
        .metadata()
        .then(function (metadata) {
        const searchFile = {
            filename: req.params.id,
            width: (reqWidth === 0 ? (metadata.width || 0) : reqWidth),
            height: (reqHeight === 0 ? (metadata.height || 0) : reqHeight)
        };
        var cachedFile = cache.get(searchFile.filename + ":" + searchFile.width + ":" + searchFile.height);
        console.log(searchFile.filename + "x" + searchFile.width + "x" + searchFile.height + "x" + cache.itemCount);
        if (cachedFile === undefined) {
            app.set('cacheMisses', app.get('cacheMisses') + 1);
            console.log("default cache miss");
            cache.forEach(function (valueT, keyT, cacheT) {
                console.log(keyT);
                console.log(valueT[0] + "!!" + valueT[1] + "!!" + valueT[2]);
            });
            var transform = sharp_1.default();
            if (!metadata.format) {
                transform = transform.toFormat('jpeg');
            }
            const readStream = fs_1.default.createReadStream(filePath);
            if ((metadata.width == reqWidth && metadata.height == reqHeight) ||
                (reqWidth > 3840 || reqHeight > 2160) ||
                (reqWidth == 0 || reqHeight == 0)) {
                readStream.pipe(transform).toBuffer().then(function (data) {
                    const buf = data.toString('base64');
                    cache.set(searchFile.filename + ":" + searchFile.width + ":" + searchFile.height, buf);
                    app.set('totalNumberOfCachedFiles', cache.itemCount);
                    app.set('totalLengthOfCachedFiles', cache.length);
                    console.log('default too big file: ' + reqWidth + "x" + reqHeight);
                    outputFile(mode, res, buf, metadata);
                });
            }
            else {
                transform = transform.resize(reqWidth, reqHeight, {
                    fit: 'fill'
                });
                readStream.pipe(transform).toBuffer().then(function (data) {
                    const buf = data.toString('base64');
                    cache.set(searchFile.filename + ":" + searchFile.width + ":" + searchFile.height, buf);
                    app.set('resFilesNum', app.get('resFilesNum') + 1);
                    app.set('totalNumberOfCachedFiles', cache.itemCount);
                    app.set('totalLengthOfCachedFiles', cache.length);
                    console.log('default resize');
                    outputFile(mode, res, buf, metadata);
                });
            }
        }
        else {
            app.set('cacheHits', app.get('cacheHits') + 1);
            console.log('default cache hit');
            outputFile(mode, res, cachedFile, metadata);
        }
    });
}
function outputFile(mode, res, buf, metadata) {
    if (mode == "raw") {
        res.writeHead(200, {
            'Content-Type': 'image/' + metadata.format,
            'Content-Length': buf.length
        });
        res.end(Buffer.from(buf, 'base64'));
    }
    else if (mode == "page")
        res.render('image', { format: metadata.format, buffer: buf });
}
//# sourceMappingURL=images.js.map