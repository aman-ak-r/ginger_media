"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const results_controller_1 = require("../controllers/results.controller");
const router = (0, express_1.Router)();
router.get('/', results_controller_1.listUploads);
router.get('/:jobId/status', results_controller_1.getStatus);
router.get('/:jobId/results', results_controller_1.getResults);
exports.default = router;
//# sourceMappingURL=results.routes.js.map