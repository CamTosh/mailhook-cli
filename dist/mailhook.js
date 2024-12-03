#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const nanoid_1 = require("nanoid");
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_mailin_1 = __importDefault(require("node-mailin"));
const config_1 = require("./config");
const s3_1 = require("./services/s3");
(0, dotenv_1.config)();
class Mailhook {
    constructor() {
        this.config = (0, config_1.loadConfig)();
        if (this.config.mailhook.some((hook) => hook.forwardAttachments)) {
            this.s3Service = new s3_1.S3Service();
        }
    }
    async processAttachments(attachments = []) {
        if (!this.s3Service || !attachments.length) {
            return [];
        }
        const processedAttachments = [];
        for (const attachment of attachments) {
            try {
                const url = await this.s3Service.uploadFile(attachment);
                processedAttachments.push({
                    filename: attachment.filename,
                    size: attachment.size,
                    contentType: attachment.contentType,
                    url,
                });
            }
            catch (error) {
                console.error("Failed to process attachment:", error);
            }
        }
        return processedAttachments;
    }
    async callWebhook(hookConfig, payload) {
        try {
            const response = await (0, node_fetch_1.default)(hookConfig.webhook, {
                method: hookConfig.method || "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        catch (error) {
            throw new Error(`Webhook call failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async processEmail(email) {
        var _a, _b, _c, _d;
        const toAddress = (_a = email.to[0]) === null || _a === void 0 ? void 0 : _a.address;
        if (!toAddress) {
            console.error("Invalid email: missing recipient address");
            return;
        }
        const hookConfig = this.config.mailhook.find((h) => h.email === toAddress);
        if (!hookConfig) {
            console.log(`No webhook configured for ${toAddress}`);
            return;
        }
        const attachments = hookConfig.forwardAttachments
            ? await this.processAttachments(email.attachments)
            : [];
        const payload = {
            id: (0, nanoid_1.nanoid)(),
            received_at: email.date,
            from: email.from.map((f) => f.address),
            to: email.to.map((t) => t.address),
            subject: (_b = email.subject) !== null && _b !== void 0 ? _b : "",
            text: (_c = email.text) !== null && _c !== void 0 ? _c : "",
            html: (_d = email.html) !== null && _d !== void 0 ? _d : null,
            attachments,
        };
        try {
            await this.callWebhook(hookConfig, payload);
            console.log(`Webhook called successfully for ${toAddress}`);
        }
        catch (error) {
            console.error(`Error processing email for ${toAddress}:`, error);
        }
    }
    start() {
        const port = Number.parseInt(process.env.SMTP_PORT || "25", 10);
        console.log("\n🚀 Starting Mailhook SMTP Server...\n");
        console.log("-------------------------");
        console.log(`📮 SMTP Port: ${port}`);
        console.log(`📧 Configured mailhooks: ${this.config.mailhook.length}`);
        this.config.mailhook.forEach((hook, index) => {
            console.log(`\n   ${index + 1}. ${hook.email}`);
            console.log(`      ├── Webhook: ${hook.method || "POST"} ${hook.webhook}`);
            console.log(`      └── Attachments: ${hook.forwardAttachments ? "Enabled" : "Disabled"}`);
        });
        console.log(`\n📦 S3 Storage: ${this.s3Service ? "Configured" : "Not configured"}`);
        if (this.s3Service) {
            console.log(`   Region: ${process.env.AWS_REGION}`);
            console.log(`   Bucket: ${process.env.AWS_BUCKET_NAME}`);
        }
        console.log("");
        node_mailin_1.default.start({
            port,
            logLevel: "info",
            smtpOptions: { banner: "Mailhook SMTP Server" },
        });
        node_mailin_1.default.on("message", (connection, data) => {
            var _a;
            const fromAddresses = data.from.map((f) => f.address).join(", ");
            const toAddresses = data.to.map((t) => t.address).join(", ");
            console.log("\n📨 New Email Received:");
            console.log(`   From: ${fromAddresses}`);
            console.log(`   To: ${toAddresses}`);
            console.log(`   Subject: ${data.subject || "(no subject)"}`);
            console.log(`   Attachments: ${((_a = data.attachments) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
            this.processEmail(data).catch(console.error);
        });
        console.log("\n✅ Mailhook is ready to receive emails!");
        console.log("-------------------------\n");
    }
}
try {
    const mailhook = new Mailhook();
    mailhook.start();
}
catch (error) {
    console.error("Failed to start Mailhook:", error);
    process.exit(1);
}
