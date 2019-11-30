describe('TestGetStats', function () {
    it('GetStatsFormat', function () {
        cy.request('localhost:3000/stats')
            .then((response) => {
                expect(response.body).to.match(/(^Original files: ([0-9]*) Resized files: ([0-9]*) cacheHits: ([0-9]*) cacheMisses: ([0-9]*) totalNumberOfCachedFiles: ([0-9]*) totalLengthOfCachedFiles: ([0-9]*)$)/);
            })
    })
});