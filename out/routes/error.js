"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
router.get('/');
router.all('/', function (req, res) {
    res.send("You've reached a wrong place!");
});
module.exports = router;
//# sourceMappingURL=error.js.map