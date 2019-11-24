import express from "express";
var router = express.Router();

/* GET error page. */
router.get('/');

router.all('/', function(req, res){
    res.send("You've reached a wrong place!");
 });

module.exports = router;
