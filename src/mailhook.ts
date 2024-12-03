#!/usr/bin/env node
import { config as dotenvConfig } from "dotenv";
import { nanoid } from "nanoid";
import fetch from "node-fetch";

const nodeMailin = require("node-mailin");

import { loadConfig } from "./config";
import { S3Service } from "./services/s3";
import type { EmailData, ProcessedAttachment } from "./types";

dotenvConfig();

class Mailhook {
	private config;
	private s3Service?: S3Service;

	constructor() {
		this.config = loadConfig();

		if (this.config.mailhook.some((hook) => hook.forwardAttachments)) {
			this.s3Service = new S3Service();
		}
	}

	private async processAttachments(
		attachments: EmailData["attachments"] = [],
	): Promise<ProcessedAttachment[]> {
		if (!this.s3Service || !attachments.length) {
			return [];
		}

		const processedAttachments: ProcessedAttachment[] = [];

		for (const attachment of attachments) {
			try {
				const url = await this.s3Service.uploadFile(attachment);
				processedAttachments.push({
					filename: attachment.filename,
					size: attachment.size,
					contentType: attachment.contentType,
					url,
				});
			} catch (error) {
				console.error("Failed to process attachment:", error);
			}
		}

		return processedAttachments;
	}

	private async callWebhook(
		hookConfig: (typeof this.config.mailhook)[0],
		payload: Record<string, unknown>,
	) {
		try {
			const response = await fetch(hookConfig.webhook, {
				method: hookConfig.method || "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
		} catch (error) {
			throw new Error(
				`Webhook call failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async processEmail(email: EmailData): Promise<void> {
		const toAddress = email.to[0]?.address;
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
			id: nanoid(),
			received_at: email.date,
			from: email.from.map((f) => f.address),
			to: email.to.map((t) => t.address),
			subject: email.subject ?? "",
			text: email.text ?? "",
			html: email.html ?? null,
			attachments,
		};

		try {
			await this.callWebhook(hookConfig, payload);
			console.log(`Webhook called successfully for ${toAddress}`);
		} catch (error) {
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
			console.log(
				`      ├── Webhook: ${hook.method || "POST"} ${hook.webhook}`,
			);
			console.log(
				`      └── Attachments: ${hook.forwardAttachments ? "Enabled" : "Disabled"}`,
			);
		});

		console.log(
			`\n📦 S3 Storage: ${this.s3Service ? "Configured" : "Not configured"}`,
		);
		if (this.s3Service) {
			console.log(`   Region: ${process.env.AWS_REGION}`);
			console.log(`   Bucket: ${process.env.AWS_BUCKET_NAME}`);
		}
		console.log("");

		nodeMailin.start({
			port,
			logLevel: "info",
			smtpOptions: { banner: "Mailhook SMTP Server" },
		});

		nodeMailin.on("message", (connection: unknown, data: EmailData) => {
			const fromAddresses = data.from.map((f) => f.address).join(", ");
			const toAddresses = data.to.map((t) => t.address).join(", ");

			console.log("\n📨 New Email Received:");
			console.log(`   From: ${fromAddresses}`);
			console.log(`   To: ${toAddresses}`);
			console.log(`   Subject: ${data.subject || "(no subject)"}`);
			console.log(`   Attachments: ${data.attachments?.length || 0}`);

			this.processEmail(data).catch(console.error);
		});

		console.log("\n✅ Mailhook is ready to receive emails!");
		console.log("-------------------------\n");
	}
}

try {
	const mailhook = new Mailhook();
	mailhook.start();
} catch (error) {
	console.error("Failed to start Mailhook:", error);
	process.exit(1);
}
