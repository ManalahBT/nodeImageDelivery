"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sharp_1 = __importDefault(require("sharp"));
var router = express_1.default.Router();
router.get('/:id/page', function (req, res, next) {
    var fs = require('fs');
    if (fs.existsSync('images/original/' + req.params.id)) {
        if (req.query.size != undefined) {
            const ret = /^(\d+)x(\d+)$/i.exec(req.query.size);
            if (ret !== null && ret.length !== 0) {
                var reqWidth = parseInt(ret[1], 10);
                var reqHeight = parseInt(ret[2], 10);
                const readStream = fs.createReadStream('images/original/' + req.params.id);
                const image = sharp_1.default('images/original/' + req.params.id);
                image
                    .metadata()
                    .then(function (metadata) {
                    if ((metadata.width == reqWidth && metadata.height == reqHeight) ||
                        (reqWidth > 3840 || reqHeight > 2160)) {
                        res.render('image', { imagePath: '/original/' + req.params.id });
                    }
                    else {
                        image.resize(reqWidth, reqHeight).pipe(res);
                    }
                });
            }
            else {
                res.render('image', { imagePath: '/original/' + req.params.id });
            }
        }
        else {
            res.render('image', { imagePath: '/original/' + req.params.id });
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