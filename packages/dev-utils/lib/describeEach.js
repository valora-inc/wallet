"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function describeEach(testCases, fn) {
    var _loop_1 = function (testCase) {
        describe(testCase.label, function () { return fn(testCase); });
    };
    for (var _i = 0, testCases_1 = testCases; _i < testCases_1.length; _i++) {
        var testCase = testCases_1[_i];
        _loop_1(testCase);
    }
}
exports.describeEach = describeEach;
//# sourceMappingURL=describeEach.js.map