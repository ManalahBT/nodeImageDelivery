"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
var test = 5;
app.get;
var router = express_1.default.Router();
router.get('/:id/page', function (req, res, next) {
    if (fs_1.default.existsSync('images/' + req.params.id)) {
        if (req.query.size != undefined) {
            const ret = /^(\d+)x(\d+)$/i.exec(req.query.size);
            if (ret !== null && ret !== undefined && ret.length !== 0) {
                var reqWidth = parseInt(ret[1], 10);
                var reqHeight = parseInt(ret[2], 10);
                const image = sharp_1.default('images/' + req.params.id);
                image
                    .metadata()
                    .then(function (metadata) {
                    if ((metadata.width == reqWidth && metadata.height == reqHeight) ||
                        (reqWidth > 3840 || reqHeight > 2160)) {
                        res.render('image', { imagePath: '/' + req.params.id });
                    }
                    else {
                        var transform = sharp_1.default();
                        if (!metadata.format) {
                            transform = transform.toFormat('jpeg');
                        }
                        else {
                        }
                        transform = transform.resize(reqWidth, reqHeight, {
                            fit: 'contain'
                        });
                        const readStream = fs_1.default.createReadStream('images/' + req.params.id);
                        readStream.pipe(transform).toBuffer().then(function (data) {
                            res.render('image', { format: metadata.format, buffer: data.toString('base64') });
                        });
                    }
                });
            }
            else {
                res.render('image', { imagePath: '/' + req.params.id });
            }
        }
        else {
            res.render('image', { imagePath: '/' + req.params.id });
        }
    }
    else {
        res.send('File ' + req.params.id + ' not found');
    }
});
router.get('/:id', function (req, res, next) {
});
module.exports = router;
//# sourceMappingURL=images.js.map