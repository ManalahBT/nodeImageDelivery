"use strict";
describe('TestGetImage', function () {
    it('GetImageRaw', function () {
        cy.request('localhost:3000/image/img_1.jpg')
            .then((response) => {
            expect(response.headers['content-type']).to.eq("image/jpeg");
            expect(response.status).to.eq(200);
            expect(response.body).to.not.be.null;
        });
    });
    it('GetResizedImage', function () {
        cy.request('localhost:3000/image/img_1.jpg?size=300x20')
            .then((response) => {
            expect(response.headers['content-type']).to.eq("image/jpeg");
            expect(response.status).to.eq(200);
            expect(response.body).to.not.be.null;
        });
    });
    it('GetResizedImageWithWrongParameterStillReturnsOriginalImage', function () {
        cy.request('localhost:3000/image/img_1.jpg?fakesize=300x20')
            .then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.not.be.null;
        });
    });
    it('FailToGetInvalidImage', function () {
        cy.request({
            method: 'GET',
            url: 'localhost:3000/image/NO_IMAGE.jpg',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404);
        });
    });
});
//# sourceMappingURL=TestGetImage.js.map