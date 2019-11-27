import express from "express";
var router = express.Router();

/* GET stats page. */
router.get('/page', function(req, res, next) {
    res.render('stats', { 
        origFilesNum: req.app.get('origFilesNum'),
        resFilesNum: req.app.get('resFilesNum'),
        cacheHits: req.app.get('cacheHits'),
        cacheMisses: req.app.get('cacheMisses'),
        additionalInfo: req.app.get('additionalInfo')
  });
});

// GET stats raw info.
router.get('/', function(req, res, next) {
  res.send("Original files: " + req.app.get('origFilesNum') + " Resized files: " + req.app.get('resFilesNum') + 
  " cacheHits: " + req.app.get('cacheHits') + " cacheMisses: " + req.app.get('cacheMisses') + " additionalInfo: " + req.app.get('additionalInfo'));
});

module.exports = router;
