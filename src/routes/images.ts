import express from "express";
import sharp from "sharp";
import fs from "fs";

var router = express.Router();

// GET image page. 
router.get('/:id/page', function(req, res, next) {
    // File system processing
    if(fs.existsSync('images/' + req.params.id)) 
    {
      if(req.query.size != undefined)
      {
        // matches only a query of exact format <number>x<number>
        const ret = /^(\d+)x(\d+)$/i.exec(req.query.size);
        if(ret !== null && ret !== undefined && ret.length !== 0)
        {
            var reqWidth = parseInt(ret[1], 10);
            var reqHeight = parseInt(ret[2], 10);
            
            const image = sharp('images/' + req.params.id);
            image
            .metadata()
            .then(function(metadata) {
                // 800x535 img_1.jpg console.log(metadata.width + " " + metadata.height);
                /* In two further cases we will return the original file: 
                  1) if requested resolution identical to original one
                  2) If requested width or height are grater than 4k, load on CPU will 
                  be considered too high. In this case, we will return the original file
                  in order to preserve aspect ratio */
                if( (metadata.width == reqWidth && metadata.height == reqHeight) ||
                  (reqWidth > 3840 || reqHeight > 2160 ) )
                {
                  res.render('image', { imagePath: '/' + req.params.id});               
                }
                else // return resized file
                {
                  var transform = sharp();
                  if (!metadata.format)
                  {
                    // if can't retrieve format, default to jpeg 
                    transform = transform.toFormat('jpeg');
                    //res.type('image/jpeg');
                  }
                  else
                  {
                    // keep the format otherwise
                    //res.type('image/' + metadata.format);
                  }
                  
                  // Actual resize
                  transform = transform.resize(reqWidth, reqHeight, {
                        fit: 'contain'
                      });
                
                  /* Try to pass only bits of file at a time. 
                    Idealy, whole image shouldn't be loaded into memory at once
                  */
                  const readStream = fs.createReadStream('images/' + req.params.id)
                  readStream.pipe(transform).toBuffer().then(function(data) {
                    res.render('image', { format: metadata.format, buffer: data.toString('base64')})
                  });
                }
              });
        } 
        else // file found; but invalid resolution. sending original file
        {
          res.render('image', { imagePath: '/' + req.params.id});     
        }
      }
      else // file found; but no specific resolution requested. sending original file
      {
        res.render('image', { imagePath: '/' + req.params.id});   
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
