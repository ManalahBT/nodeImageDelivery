import express from "express";
var router = express.Router();

// GET stats raw info.
router.get('/', function (req, res) {
  res.send("Original files: " + req.app.get('origFilesNum')
    + " Resized files: " + req.app.get('resFilesNum')
    + " cacheHits: " + req.app.get('cacheHits')
    + " cacheMisses: " + req.app.get('cacheMisses')
    + " totalNumberOfCachedFiles: " + req.app.get('totalNumberOfCachedFiles')
    + " totalLengthOfCachedFiles: " + req.app.get('totalLengthOfCachedFiles')
  );
});

// GET stats page.
router.get('/page', function (req, res) {
  res.render('stats', {
    origFilesNum: req.app.get('origFilesNum'),
    resFilesNum: req.app.get('resFilesNum'),
    cacheHits: req.app.get('cacheHits'),
    cacheMisses: req.app.get('cacheMisses'),
    totalNumberOfCachedFiles: req.app.get('totalNumberOfCachedFiles'),
    totalLengthOfCachedFiles: req.app.get('totalLengthOfCachedFiles'),
  });
});

module.exports = router;
