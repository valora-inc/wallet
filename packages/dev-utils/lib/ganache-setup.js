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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var ganache = __importStar(require("@celo/ganache-cli"));
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var targz = __importStar(require("targz"));
var MNEMONIC = 'concert load couple harbor equip island argue ramp clarify fence smart topic';
exports.ACCOUNT_PRIVATE_KEYS = [
    '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
    '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72',
    '0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1',
    '0xff12e391b79415e941a94de3bf3a9aee577aed0731e297d5cfa0b8a1e02fa1d0',
    '0x752dd9cf65e68cfaba7d60225cbdbc1f4729dd5e5507def72815ed0d8abc6249',
    '0xefb595a0178eb79a8df953f87c5148402a224cdf725e88c0146727c6aceadccd',
    '0x83c6d2cc5ddcf9711a6d59b417dc20eb48afd58d45290099e5987e3d768f328f',
    '0xbb2d3f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2',
    '0xb2fd4d29c1390b71b8795ae81196bfd60293adf99f9d32a0aff06288fcdac55f',
    '0x23cb7121166b9a2f93ae0b7c05bde02eae50d64449b2cbb42bc84e9d38d6cc89',
];
exports.ACCOUNT_ADDRESSES = [
    '0x5409ED021D9299bf6814279A6A1411A7e866A631',
    '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
    '0xE36Ea790bc9d7AB70C55260C66D52b1eca985f84',
    '0xE834EC434DABA538cd1b9Fe1582052B880BD7e63',
    '0x78dc5D2D739606d31509C31d654056A45185ECb6',
    '0xA8dDa8d7F5310E4A9E24F8eBA77E091Ac264f872',
    '0x06cEf8E666768cC40Cc78CF93d9611019dDcB628',
    '0x4404ac8bd8F9618D27Ad2f1485AA1B2cFD82482D',
    '0x7457d5E02197480Db681D3fdF256c7acA21bDc12',
    '0x91c987bf62D25945dB517BDAa840A6c661374402',
];
function startGanache(filePath, datafile, opts) {
    if (opts === void 0) { opts = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var chainCopyBase, chainCopy, filenameWithPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    chainCopyBase = process.env.GANACHE_CHAIN_DATA_PATH || path.resolve(filePath);
                    chainCopy = path.resolve(path.join(chainCopyBase, 'tmp/copychain'));
                    console.log(chainCopy);
                    console.log(filePath, datafile);
                    filenameWithPath = path.resolve(path.join(filePath, datafile));
                    // erases tmp chain
                    if (fs.existsSync(chainCopy)) {
                        console.log("Removing old chain tmp folder: " + chainCopy);
                        fs.removeSync(chainCopy);
                    }
                    console.log("Creating chain tmp folder: " + chainCopy);
                    fs.mkdirsSync(chainCopy);
                    if (!opts.from_targz) return [3 /*break*/, 2];
                    return [4 /*yield*/, decompressChain(filenameWithPath, chainCopy)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    fs.copySync(filenameWithPath, chainCopy);
                    _a.label = 3;
                case 3: return [2 /*return*/, launchServer(opts, chainCopy)];
            }
        });
    });
}
exports.startGanache = startGanache;
function launchServer(opts, chain) {
    return __awaiter(this, void 0, void 0, function () {
        var logFn, server;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logFn = opts.verbose
                        ? // tslint:disable-next-line: no-console
                            function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                return console.log.apply(console, args);
                            }
                        : function () {
                            /*nothing*/
                        };
                    server = ganache.server({
                        default_balance_ether: 1000000,
                        logger: {
                            log: logFn,
                        },
                        network_id: 1101,
                        db_path: chain,
                        mnemonic: MNEMONIC,
                        gasLimit: 20000000,
                        allowUnlimitedContractSize: true,
                    });
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            server.listen(8545, function (err, blockchain) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve(blockchain);
                                }
                            });
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, function () {
                            return new Promise(function (resolve, reject) {
                                server.close(function (err) {
                                    if (err) {
                                        reject(err);
                                    }
                                    else {
                                        resolve();
                                    }
                                });
                            });
                        }];
            }
        });
    });
}
function decompressChain(tarPath, copyChainPath) {
    console.log('Decompressing chain');
    return new Promise(function (resolve, reject) {
        targz.decompress({ src: tarPath, dest: copyChainPath }, function (err) {
            if (err) {
                console.error(err);
                reject(err);
            }
            else {
                console.log('Chain decompressed');
                resolve();
            }
        });
    });
}
function setup(filePath, datafile, opts) {
    if (opts === void 0) { opts = {}; }
    return startGanache(filePath, datafile, opts)
        .then(function (stopGanache) {
        ;
        global.stopGanache = stopGanache;
    })
        .catch(function (err) {
        console.error('Error starting ganache, Doing `yarn test:reset` might help');
        console.error(err);
        process.exit(1);
    });
}
exports.default = setup;
function emptySetup(opts) {
    if (opts === void 0) { opts = {}; }
    return launchServer(opts)
        .then(function (stopGanache) {
        ;
        global.stopGanache = stopGanache;
    })
        .catch(function (err) {
        console.error(err);
        process.exit(1);
    });
}
exports.emptySetup = emptySetup;
//# sourceMappingURL=ganache-setup.js.map