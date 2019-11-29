var path = require('path');
import fs from "fs" 

describe('TestGetStats', function() {
    it('GetDefaultStatsFormat', function() {
            cy.request('localhost:3000/stats')
                .then((response) => {
                    expect(response.body).to.match(/(^Original files: ([0-9]*) Resized files: 0 cacheHits: 0 cacheMisses: 0 totalNumberOfCachedFiles: 0 totalLengthOfCachedFiles: 0$)/);
       })
    })

    /* TODO fix or delete
    it("CheckOriginalNumberOfFilesInDefaultStats", function() {
        var origFilesNum = 0;
        cy.task(fs.readdir('../../../images', (err: NodeJS.ErrnoException | null, files: string[]): void => {
            origFilesNum = files.length;
            cy.request('localhost:3000/stats')
                .then((response) => {
                    var re = /(^[0-9]*$)/;
                    var result: RegExpExecArray | null;
                    if((result = re.exec(response.body)) !== null) {
                        var matchIndex = result.index;
                        var t = result[0].length;
                        expect(result[0]).to.match(origFilesNum.toString());
                    }
                    else{
                        assert.fail(0, 1, 'Invalid format');
                    }
                    var result = re.exec(response.body);    
                });
        })); 
    })*/
});