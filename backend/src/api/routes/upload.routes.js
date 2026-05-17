"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const validateUpload_1 = require("../middleware/validateUpload");
const router = (0, express_1.Router)();
router.post('/', validateUpload_1.uploadMiddleware, validateUpload_1.handleMulterError, upload_controller_1.uploadImage);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map