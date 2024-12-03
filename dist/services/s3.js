"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const nanoid_1 = require("nanoid");
class S3Service {
    constructor() {
        const requiredEnvVars = [
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "AWS_REGION",
            "AWS_BUCKET_NAME",
        ];
        const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
        if (missingEnvVars.length > 0) {
            throw new Error(`AWS credentials required. Missing: ${missingEnvVars.join(", ")}`);
        }
        this.s3 = new aws_sdk_1.default.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });
    }
    async uploadFile(attachment) {
        const key = `${(0, nanoid_1.nanoid)()}/${attachment.filename}`;
        await this.s3
            .upload({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: attachment.content,
            ContentType: attachment.contentType,
            ACL: "public-read",
        })
            .promise();
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
}
exports.S3Service = S3Service;
