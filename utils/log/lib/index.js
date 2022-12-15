'use strict';
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const npmlog_1 = require("npmlog");
npmlog_1.default.level = (_a = process.env.LOG_LEVEL) !== null && _a !== void 0 ? _a : 'info';
npmlog_1.default.heading = 'mc91';
npmlog_1.default.addLevel('success', 2000, { fg: 'green', bold: true });
exports.default = npmlog_1.default;
//# sourceMappingURL=index.js.map