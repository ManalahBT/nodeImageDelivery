import express from "express";
import sharp from "sharp";
import fs from "fs";
import LRU from "lru-cache"
import { Application } from "express-serve-static-core";
var router = express.Router();

// TODO Ensure caching works across workers
// Caching. Required throughout the lifecycle of a service instance
var cache = new LRU({
  max: 50 * 350000 // very rought estimate of 50 images@4k resolution based on img_6.jpg. Will vary widely based upon content and format
  , length: function (value: string, key: string) { return value.length; }  // value=buffer; key=filename+with+Height
  , stale: true // don't return undefine for a file that exceedes maxAge. First return it then delete it.
  , updateAgeOnGet: true // if a value is retrieved from cache, maxAge counter for it is reset
  , maxAge: 1000 * 60 * 60
}) //  In seconds = 3600000; In minutes = 60000; In hours = 1000; In days >41.5

// GET stats raw.
router.get('/:id', function (req, res) {
  processFileAndURL(req, res, "raw");
});

// GET stats page. 
router.get('/:id/page', function (req, res) {
  processFileAndURL(req, res, "page");
});

module.exports = router;
function processFileAndURL(req: any, res: any, mode: string) {
  if (mode != "page" && mode != "raw") {
    res.status(500);
    res.send('Invalid mode');
    return;
  }

  var app = req.app; // get app object
  const filePath = 'images/' + req.params.id;
  // File system processing
  if (fs.existsSync(filePath)) {
    const image = sharp(filePath);
    // matches only a query of exact format <number>x<number>
    const ret = /^(\d+)x(\d+)$/i.exec(req.query.size);
    if (req.query.size != undefined &&
      ret !== null && ret !== undefined && ret.length !== 0) {
      var reqWidth = parseInt(ret[1], 10);
      var reqHeight = parseInt(ret[2], 10);
      cacheAndForward(app, image, req, res, filePath, mode, reqWidth, reqHeight);
    }
    else // file found; invalid or but no specific resolution requested. sending original file
    {
      cacheAndForward(app, image, req, res, filePath, mode, 0, 0);
    }
  }
  else { //couldn't find file in filesystem
    res.status(404);
    res.send('File ' + req.params.id + ' not found');
  }
}

function cacheAndForward(app: Application, image: sharp.Sharp, req: any, res: any, filePath: string, mode: string, reqWidth: number = 0, reqHeight: number = 0) {
  if (mode != "page" && mode != "raw") {
    res.status(500);
    res.send('Invalid mode');
    return;
  }

  image
    .metadata()
    .then(function (metadata) {
      // Search for file in cache
      const searchFile = {
        filename: req.params.id,
        width: (reqWidth === 0 ? (metadata.width || 0) : reqWidth),
        height: (reqHeight === 0 ? (metadata.height || 0) : reqHeight)
      };
      var cachedFile = cache.get(searchFile.filename + ":" + searchFile.width + ":" + searchFile.height);
      if (cachedFile === undefined) // file not found in cache
      {
        // File not found in cache; actually attempt to resize it then set it in cache
        app.set('cacheMisses', (<number><any>app.get('cacheMisses')) + 1);
        // setup file resize/processing for later. For sure we will need this if file not in cache
        var transform = sharp();
        if (!metadata.format) {
          transform = transform.toFormat('jpeg'); // jpeg selected as default format
        }
        /* Try to pass only bits of file at a time.
          Idealy, whole image shouldn't be loaded into memory at once
        */
        const readStream = fs.createReadStream(filePath);
        /* In four cases we will return the original file:
        1) if requested resolution identical to original one (regardless of resultion; 
          as it is assumed client side will validate against uploading of files that are too big)
        2) If requested width or height are grater than 4k, load on CPU will
        be considered too high. In this case, we will return the original file
        in order to preserve aspect ratio 
        3) No specific resolution requested. Height and width will default to 0
        4) Invalid resolution query passed to us. Height and width will default to 0
        */
        if ((metadata.width == reqWidth && metadata.height == reqHeight) ||
          (reqWidth > 3840 || reqHeight > 2160) ||
          (reqWidth == 0 || reqHeight == 0)) {
          readStream.pipe(transform).toBuffer().then(function (data) {
            const buf = data.toString('base64');
            cache.set(searchFile.filename + ":" + searchFile.width + ":" + searchFile.height, buf); // Update cache
            app.set('totalNumberOfCachedFiles', cache.itemCount);
            app.set('totalLengthOfCachedFiles', cache.length);
            outputFile(mode, res, data, metadata);
          });
        }
        else { // Actual resize
          transform = transform.resize(reqWidth, reqHeight, {
            fit: 'fill'
          });
          readStream.pipe(transform).toBuffer().then(function (data) {
            const buf = data.toString('base64');
            cache.set(searchFile.filename + ":" + searchFile.width + ":" + searchFile.height, buf); //(searchFile, buf); // Update cache
            app.set('resFilesNum', (<number><any>app.get('resFilesNum')) + 1);
            app.set('totalNumberOfCachedFiles', cache.itemCount);
            app.set('totalLengthOfCachedFiles', cache.length);
            outputFile(mode, res, data, metadata);
          });
        }
      }
      else {
        app.set('cacheHits', (<number><any>app.get('cacheHits')) + 1);
        outputFile(mode, res, cachedFile, metadata);
      }
    });
}

function outputFile(mode: string, res: any, buf: string | Buffer, metadata: sharp.Metadata) {
  if (mode != "page" && mode != "raw") {
    res.status(500);
    res.send('Invalid mode');
    return;
  }

  if (mode == "raw") {
    if (typeof buf === "string") // string. cached
    {
      res.writeHead(200);
      res.end(Buffer.from(buf, 'base64'));
    }
    else  // from buffer; non-cached
    {
      res.writeHead(200, {
        'Content-Type': 'image/' + metadata.format,
        'Content-Length': buf.length
      });
      res.end(buf);
    }
  }
  else if (mode == "page") {
    if (typeof buf === "string") // string. cached
      res.render('image', { format: metadata.format, buffer: buf });
    else  // buffer. non-cache
      res.render('image', { format: metadata.format, buffer: buf.toString('base64') });
  }
}