"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var web3_1 = __importDefault(require("web3"));
var migration_override_json_1 = __importDefault(require("./migration-override.json"));
exports.NetworkConfig = migration_override_json_1.default;
function jsonRpcCall(web3, method, params) {
    return new Promise(function (resolve, reject) {
        if (web3.currentProvider && typeof web3.currentProvider !== 'string') {
            web3.currentProvider.send({
                id: new Date().getTime(),
                jsonrpc: '2.0',
                method: method,
                params: params,
            }, function (err, res) {
                if (err) {
                    reject(err);
                }
                else if (!res) {
                    reject(new Error('no response'));
                }
                else if (res.error) {
                    reject(new Error("Failed JsonRpcResponse: method: " + method + " params: " + params + " error: " + JSON.stringify(res.error)));
                }
                else {
                    resolve(res.result);
                }
            });
        }
        else {
            reject(new Error('Invalid provider'));
        }
    });
}
exports.jsonRpcCall = jsonRpcCall;
function timeTravel(seconds, web3) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, jsonRpcCall(web3, 'evm_increaseTime', [seconds])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, jsonRpcCall(web3, 'evm_mine', [])];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.timeTravel = timeTravel;
function mineBlocks(blocks, web3) {
    return __awaiter(this, void 0, void 0, function () {
        var i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < blocks)) return [3 /*break*/, 4];
                    return [4 /*yield*/, jsonRpcCall(web3, 'evm_mine', [])];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.mineBlocks = mineBlocks;
function evmRevert(web3, snapId) {
    return jsonRpcCall(web3, 'evm_revert', [snapId]);
}
exports.evmRevert = evmRevert;
function evmSnapshot(web3) {
    return jsonRpcCall(web3, 'evm_snapshot', []);
}
exports.evmSnapshot = evmSnapshot;
function testWithGanache(name, fn) {
    var _this = this;
    var web3 = new web3_1.default('http://localhost:8545');
    describe(name, function () {
        var snapId = null;
        beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(snapId != null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, evmRevert(web3, snapId)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, evmSnapshot(web3)];
                    case 3:
                        snapId = _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        afterAll(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(snapId != null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, evmRevert(web3, snapId)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
        fn(web3);
    });
}
exports.testWithGanache = testWithGanache;
/**
 * Gets a contract address by parsing blocks and matching event signatures against the given event.
 * `canValidate` actually controls whether we grab the first or second contract associated with
 * the given `eventSignature`. This is to allow for deployment of two contracts with distinct
 * setup parameters for testing.
 */
function getContractFromEvent(eventSignature, web3, canValidate) {
    return __awaiter(this, void 0, void 0, function () {
        var currBlockNumber, currBlock, contractAddress, target, matchesFound, _i, _a, tx, txFull, _b, _c, log, _d, _e, topic;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, web3.eth.getBlockNumber()];
                case 1:
                    currBlockNumber = _f.sent();
                    target = web3.utils.sha3(eventSignature);
                    matchesFound = 0;
                    _f.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 8];
                    return [4 /*yield*/, web3.eth.getBlock(currBlockNumber)];
                case 3:
                    currBlock = _f.sent();
                    _i = 0, _a = currBlock.transactions;
                    _f.label = 4;
                case 4:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    tx = _a[_i];
                    return [4 /*yield*/, web3.eth.getTransactionReceipt(tx)];
                case 5:
                    txFull = _f.sent();
                    if (txFull.logs) {
                        for (_b = 0, _c = txFull.logs; _b < _c.length; _b++) {
                            log = _c[_b];
                            if (log.topics) {
                                for (_d = 0, _e = log.topics; _d < _e.length; _d++) {
                                    topic = _e[_d];
                                    if (topic === target) {
                                        matchesFound++;
                                        // only every match other bc of implementation initializations
                                        if ((canValidate && matchesFound === 3) || (!canValidate && matchesFound === 1)) {
                                            contractAddress = log.address;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    _f.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    currBlockNumber--;
                    if (contractAddress !== undefined) {
                        return [3 /*break*/, 8];
                    }
                    if (currBlockNumber < 0) {
                        throw Error('Error: ReleaseGoldInstance could not be found');
                    }
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/, contractAddress];
            }
        });
    });
}
exports.getContractFromEvent = getContractFromEvent;
//# sourceMappingURL=ganache-test.js.map