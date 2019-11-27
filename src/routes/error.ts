import express from "express";
var router = express.Router();

/* GET error. */
router.all('/', function(req, res){
    res.send("You've reached a wrong place; try getting stats or images instead!");
 });

module.exports = router;
