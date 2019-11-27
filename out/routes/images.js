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
class StatItems {
}
StatItems.CacheHits = 0;
StatItems.CacheMisses = 0;
StatItems.ResizedFiles = 0;
StatItems.TotalCacheSize = 0;
class CacheKey {
    constructor() {
        this.filename = "";
        this.width = 0;
        this.height = 0;
    }
}
var cache = new lru_cache_1.default({ max: 50 * 350000,
    length: function (value, key) { return value.length; },
    dispose: function (key, value) { console.log("Deleted " + key); },
    stale: true,
    updateAgeOnGet: true,
    maxAge: 1000 * 60 * 60 });
StatItems.TotalCacheSize = cache.length;
console.log("cache.length:" + cache.length);
router.get('/:id/page', function (req, res, next) {
    if (fs_1.default.existsSync('images/' + req.params.id)) {
        const image = sharp_1.default('images/' + req.params.id);
        if (req.query.size != undefined) {
            const ret = /^(\d+)x(\d+)$/i.exec(req.query.size);
            if (ret !== null && ret !== undefined && ret.length !== 0) {
                var reqWidth = parseInt(ret[1], 10);
                var reqHeight = parseInt(ret[2], 10);
                cacheAndSend(image, req, res, reqWidth, reqHeight);
            }
            else {
                cacheAndSend(image, req, res, 0, 0);
            }
        }
        else {
            cacheAndSend(image, req, res, 0, 0);
        }
    }
    else {
        res.send('File ' + req.params.id + ' not found');
    }
});
router.get('/:id', function (req, res, next) {
});
module.exports = router;
function cacheAndSend(image, req, res, reqWidth = 0, reqHeight = 0) {
    image
        .metadata()
        .then(function (metadata) {
        var fileName = req.params.id;
        const searchFile = {
            filename: req.params.id,
            width: (reqWidth === 0 ? (metadata.width || 0) : reqWidth),
            height: (reqHeight === 0 ? (metadata.height || 0) : reqHeight)
        };
        var cachedFile = cache.get(searchFile.filename + "!" + searchFile.width + "!" + searchFile.height);
        console.log(searchFile.filename + "x" + searchFile.width + "x" + searchFile.height + "x" + cache.itemCount);
        if (cachedFile === undefined) {
            StatItems.CacheMisses++;
            console.log("default cache miss");
            cache.forEach(function (valueT, keyT, cacheT) {
                console.log(keyT);
                console.log(valueT[0] + "!!" + valueT[1] + "!!" + valueT[2]);
            });
            var transform = sharp_1.default();
            if (!metadata.format) {
                transform = transform.toFormat('jpeg');
            }
            const readStream = fs_1.default.createReadStream('images/' + req.params.id);
            if ((metadata.width == reqWidth && metadata.height == reqHeight) ||
                (reqWidth > 3840 || reqHeight > 2160) ||
                (reqWidth == 0 || reqHeight == 0)) {
                readStream.pipe(transform).toBuffer().then(function (data) {
                    const buf = data.toString('base64');
                    cache.set(searchFile.filename + "!" + searchFile.width + "!" + searchFile.height, buf);
                    StatItems.TotalCacheSize = cache.length;
                    console.log('default too big file: ' + reqWidth + "x" + reqHeight);
                    res.render('image', { format: metadata.format, buffer: buf });
                });
            }
            else {
                transform = transform.resize(reqWidth, reqHeight, {
                    fit: 'contain'
                });
                readStream.pipe(transform).toBuffer().then(function (data) {
                    const buf = data.toString('base64');
                    cache.set(searchFile.filename + "!" + searchFile.width + "!" + searchFile.height, buf);
                    StatItems.TotalCacheSize = cache.length;
                    StatItems.ResizedFiles++;
                    console.log('default resize');
                    res.render('image', { format: metadata.format, buffer: buf });
                });
            }
        }
        else {
            StatItems.CacheHits++;
            console.log('default cache hit');
            res.render('image', { format: metadata.format, buffer: cachedFile });
        }
    });
}
//# sourceMappingURL=images.js.map