import express from "express";
import sharp from "sharp";
import fs from "fs";
import LRU from "lru-cache"

var router = express.Router();

// Stats items
class StatItems {
  static CacheHits: number = 0;
  static CacheMisses: number = 0;
  static ResizedFiles: number = 0;
  static TotalCacheSize: number = 0;
}

/*
app.set('origFilesNum', origFilesNum.toString());
  app.set('resFilesNum', resFilesNum.toString());
  app.set('cacheHits', cacheHits.toString());
  app.set('cacheMisses', cacheMisses.toString());
  app.set('additionalInfo', additionalInfo.toString());
*/

class CacheKey {
  filename: string = "";
  width: number = 0;
  height: number = 0;
}

// Caching
var cache = new LRU({ max: 50 * 350000 // very rought estimate of 50 images@4k resolution based on img_6.jpg. Will vary widely based upon content and format
  , length: function(value: string, key: string){return value.length;}  // value=buffer; key=filename+with+Height
  , dispose: function (key: string, value: string) { console.log("Deleted " + key); }//key.filename + " value: " + value.length) } //TODO delete after confirm
  , stale: true // don't return undefine for a file that exceedes maxAge. First return it then delete it.
  , updateAgeOnGet: true // if a value is retrieved from cache, maxAge counter for it is reset
  , maxAge: 1000 * 60 * 60 }) //  In seconds = 3600000; In minutes = 60000; In hours = 1000; In days >41.5

StatItems.TotalCacheSize = cache.length; // TODO delete if line bellow = 0
console.log("cache.length:"+cache.length); //TODO delete

// GET image page. 
router.get('/:id/page', function(req, res, next) {
    // File system processing
    //TODO add and search in cache original sized files as well
    if(fs.existsSync('images/' + req.params.id)) 
    {
      const image = sharp('images/' + req.params.id); // used in any of the cases bellow
      if(req.query.size != undefined)
      {
        // matches only a query of exact format <number>x<number>
        const ret = /^(\d+)x(\d+)$/i.exec(req.query.size);
        if(ret !== null && ret !== undefined && ret.length !== 0)
        {
            var reqWidth = parseInt(ret[1], 10);
            var reqHeight = parseInt(ret[2], 10);
            
            cacheAndSend(image, req, res, reqWidth, reqHeight);
        } 
        else // file found; but invalid resolution. sending original file
        {
          cacheAndSend(image, req, res, 0, 0);     
        }
      }
      else // file found; but no specific resolution requested. sending original file
      {
        cacheAndSend(image, req, res, 0, 0)
      }
    }
    else
    {
      res.send('File ' + req.params.id + ' not found');
    }
});

/* GET stats raw info. */
router.get('/:id', function(req, res, next) {
});

module.exports = router;
function cacheAndSend(image: sharp.Sharp, req: any, res: any, reqWidth: number = 0, reqHeight: number = 0) {
  
  image
    .metadata()
    .then(function (metadata) {  
      // Search for file in cache
      var fileName: string = req.params.id;
      const searchFile: CacheKey = {
        filename: req.params.id,
        width: ( reqWidth===0 ? ( metadata.width || 0 ) : reqWidth ),
        height: ( reqHeight===0 ? ( metadata.height || 0 ) : reqHeight )
      };
      var cachedFile = cache.get( searchFile.filename + "!"+searchFile.width + "!" + searchFile.height);// searchFile);
      console.log(searchFile.filename+"x"+searchFile.width + "x"+searchFile.height+"x"+cache.itemCount);
      if (cachedFile === undefined) // file not found in cache
      {
        // File not found in cache; actually attempt to resize it then set it in cache
        StatItems.CacheMisses++;
        console.log("default cache miss");
        cache.forEach(function(valueT,keyT,cacheT){
          console.log(keyT); //keyT.filename+"y"+keyT.width+"y"+keyT.height);
          console.log(valueT[0]+"!!"+valueT[1]+"!!"+valueT[2]);
        });
        // setup file resize/processing for later. For sure we will need this if file not in cache
        var transform = sharp();
        if (!metadata.format) {
          // if can't retrieve format, default to jpeg 
          transform = transform.toFormat('jpeg');
        }
        /* Try to pass only bits of file at a time.
          Idealy, whole image shouldn't be loaded into memory at once
        */
        const readStream = fs.createReadStream('images/' + req.params.id);
        /* In four cases we will return the original file:
        1) if requested resolution identical to original one
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
            cache.set(searchFile.filename + "!"+searchFile.width + "!" + searchFile.height, buf);  //(searchFile, buf); // Update cache
            StatItems.TotalCacheSize = cache.length;
            //TODO check undefined format usage
            console.log('default too big file: ' + reqWidth + "x"+ reqHeight);
            res.render('image', { format: metadata.format, buffer: buf });
          });
        }
        else {
          // Actual resize
          transform = transform.resize(reqWidth, reqHeight, {
            fit: 'contain'
          });
          readStream.pipe(transform).toBuffer().then(function (data) {
            const buf = data.toString('base64');
            cache.set(searchFile.filename + "!"+searchFile.width + "!" + searchFile.height, buf); //(searchFile, buf); // Update cache
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

