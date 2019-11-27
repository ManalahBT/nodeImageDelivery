import express from "express";
import sharp from "sharp";
var router = express.Router();

/* GET stats page. */
router.get('/:id/page', function(req, res, next) {
    // File system processing
    var fs = require('fs');
    if(fs.existsSync('images/original/' + req.params.id)) 
    {
      if(req.query.size != undefined)
      {
        // matches only a query of exact format <number>x<number>
        const ret = /^(\d+)x(\d+)$/i.exec(req.query.size);
        if(ret !== null && ret.length !== 0)
        {
            var reqWidth = parseInt(ret[1], 10);
            var reqHeight = parseInt(ret[2], 10);
            const readStream = fs.createReadStream('images/original/' + req.params.id);
            const image = sharp('images/original/' + req.params.id);
            
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
                  res.render('image', { imagePath: '/original/' + req.params.id});               
                }
                else // return resized file
                {
                  image.resize(reqWidth, reqHeight).pipe(res); //.toFile('output.jpg').pipe(res);
                  //res.send('check em');
                  //res.render('image', { imagePath: '/resized/' + req.params.id});
                }
              });

            // Check if image already in requested resolution
            //fs.existsSync('images/original/' + req.params.id
        } 
        else // file found; but invalid resolution. sending original file
        {
          res.render('image', { imagePath: '/original/' + req.params.id});     
        }
      }
      else // file found; but no specific resolution requested. sending original file
      {
        res.render('image', { imagePath: '/original/' + req.params.id});   
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
