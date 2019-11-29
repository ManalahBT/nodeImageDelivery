"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require('path');
describe('TestGetStats', function () {
    it('GetDefaultStatsFormat', function () {
        cy.request('localhost:3000/stats')
            .then((response) => {
            expect(response.body).to.match(/(^Original files: ([0-9]*) Resized files: 0 cacheHits: 0 cacheMisses: 0 totalNumberOfCachedFiles: 0 totalLengthOfCachedFiles: 0$)/);
        });
    });
});
//# sourceMappingURL=TestGetStats.js.map