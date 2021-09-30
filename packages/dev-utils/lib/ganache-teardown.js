"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function tearDown() {
    console.log('Stopping ganache');
    return global.stopGanache().catch(function (err) {
        console.error('error stopping ganache');
        console.error(err);
    });
}
exports.default = tearDown;
//# sourceMappingURL=ganache-teardown.js.map