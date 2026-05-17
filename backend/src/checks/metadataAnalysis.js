"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadataAnalysis = metadataAnalysis;
const exifreader_1 = __importDefault(require("exifreader"));
const sharp_1 = require("sharp");
const index_1 = require("./index");
const fs_1 = __importDefault(require("fs"));
async function metadataAnalysis(filePath, sharpMetadata) {
    try {
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const tags = exifreader_1.default.load(fileBuffer);
        const make = tags['Make']?.description;
        const model = tags['Model']?.description;
        const software = tags['Software']?.description;
        const dateTimeOriginal = tags['DateTimeOriginal']?.description;
        const gps = tags['GPSLatitude'] ? 'Present' : 'Missing';
        const issues = [];
        let status = 'passed';
        if (software && /photoshop|gimp|edit|capture/i.test(software)) {
            status = 'warning';
            issues.push(`Edited with ${software}`);
        }
        if (!dateTimeOriginal) {
            // Not necessarily an issue, but common in screenshots
            issues.push('Missing original capture timestamp (possible screenshot)');
        }
        else {
            const captureDate = new Date(dateTimeOriginal.replace(/:/g, '-').replace(' ', 'T'));
            const now = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            if (captureDate > now) {
                status = 'warning';
                issues.push('Capture timestamp is in the future');
            }
            else if (captureDate < oneYearAgo) {
                status = 'warning';
                issues.push('Image is more than 1 year old');
            }
        }
        return {
            check: 'metadata_analysis',
            status,
            confidence: 0.9,
            detail: issues.length > 0
                ? issues.join('. ')
                : `Camera: ${make || 'Unknown'} ${model || ''}. Metadata appears consistent.`,
        };
    }
    catch (error) {
        return {
            check: 'metadata_analysis',
            status: 'warning',
            confidence: 0,
            detail: `EXIF parsing failed: ${error.message}. Possibly missing EXIF data.`,
        };
    }
}
//# sourceMappingURL=metadataAnalysis.js.map