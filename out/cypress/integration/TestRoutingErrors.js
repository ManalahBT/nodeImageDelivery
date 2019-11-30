"use strict";
describe('TestRoutingErrors', function () {
    it('GetInvalidRoute', function () {
        cy.request({
            method: 'GET',
            url: 'localhost:3000/INVALID',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(500);
        });
    });
});
//# sourceMappingURL=TestRoutingErrors.js.map