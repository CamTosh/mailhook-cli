import fs from "node:fs";
import path from "node:path";
import AWS from "aws-sdk";
import { config as dotenvConfig } from "dotenv";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import nodeMailin from "node-mailin";

type MailhookConfig = {
	mailhook: Array<{
		email: string;
		webhook: string;
		forwardAttachments: boolean;
	}>;
};

type EmailAddress = {
	address: string;
	name?: string;
};

type EmailAttachment = {
	filename: string;
	content: Buffer;
	contentType: string;
	size: number;
};

type ProcessedAttachment = Omit<EmailAttachment, "content"> & { url: string };

type EmailData = {
	to: EmailAddress[];
	from: EmailAddress[];
	date: Date;
	subject?: string;
	text?: string;
	html?: string;
	attachments?: EmailAttachment[];
};

dotenvConfig();

let s3: AWS.S3 | null = null;
const config: MailhookConfig = { mailhook: [] };

function loadConfig(): void {
	try {
		const configPath = path.join(process.cwd(), "config.json");
		const configFile = fs.readFileSync(configPath, "utf8");
		const parsedConfig = JSON.parse(configFile) as MailhookConfig;

		if (!Array.isArray(parsedConfig.mailhook)) {
			throw new Error("Invalid config format: mailhook must be an array");
		}

		config.mailhook = parsedConfig.mailhook;
	} catch (error) {
		console.error(
			"Error loading config.json:",
			error instanceof Error ? error.message : "Unknown error",
		);
		process.exit(1);
	}
}

function initializeS3(): void {
	const needsS3 = config.mailhook.some((hook) => hook.forwardAttachments);

	if (needsS3) {
		const requiredEnvVars = [
			"AWS_ACCESS_KEY_ID",
			"AWS_SECRET_ACCESS_KEY",
			"AWS_REGION",
			"AWS_BUCKET_NAME",
		];

		const missingEnvVars = requiredEnvVars.filter(
			(envVar) => !process.env[envVar],
		);

		if (missingEnvVars.length > 0) {
			console.error(
				"AWS credentials required for attachment forwarding. Missing:",
				missingEnvVars.join(", "),
			);
			process.exit(1);
		}

		s3 = new AWS.S3({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: process.env.AWS_REGION,
		});
	}
}

async function uploadToS3(attachment: EmailAttachment): Promise<string | null> {
	if (!s3) {
		console.error("S3 not initialized");
		return null;
	}

	try {
		const key = `${nanoid()}/${attachment.filename}`;

		await s3
			.upload({
				Bucket: process.env.AWS_BUCKET_NAME!,
				Key: key,
				Body: attachment.content,
				ContentType: attachment.contentType,
				ACL: "public-read",
			})
			.promise();

		return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
	} catch (error) {
		console.error(
			"Failed to upload attachment:",
			error instanceof Error ? error.message : "Unknown error",
		);
		return null;
	}
}

async function processEmail(email: EmailData): Promise<void> {
	if (!email.to?.[0]?.address) {
		console.error("Invalid email: missing recipient address");
		return;
	}

	const toAddress = email.to[0].address;
	const hookConfig = config.mailhook.find((h) => h.email === toAddress);

	if (!hookConfig) {
		console.log(`No webhook configured for ${toAddress}`);
		return;
	}

	const attachments: ProcessedAttachment[] = [];
	if (hookConfig.forwardAttachments && email.attachments?.length) {
		if (!s3) {
			console.error(
				`Cannot forward attachments for ${toAddress}: S3 not configured`,
			);
		}

		if (s3) {
			for (const attachment of email.attachments) {
				const url = await uploadToS3(attachment);
				if (!url) continue;

				attachments.push({
					filename: attachment.filename,
					size: attachment.size,
					contentType: attachment.contentType,
					url,
				});
			}
		}
	}

	const payload = {
		id: nanoid(),
		received_at: email.date,
		from: email.from?.[0]?.address ?? "unknown",
		to: toAddress,
		subject: email.subject ?? "",
		text: email.text ?? "",
		html: email.html ?? null,
		attachments,
	};

	try {
		const response = await fetch(hookConfig.webhook, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		console.log(`Webhook called for ${toAddress}: ${response.status}`);
	} catch (error) {
		console.error(
			`Error calling webhook for ${toAddress}:`,
			error instanceof Error ? error.message : "Unknown error",
		);
	}
}

loadConfig();
initializeS3();

console.log("Starting Mailhook SMTP server...");
nodeMailin.start({
	port: 25,
	logLevel: "info",
	smtpOptions: {
		banner: "Mailhook SMTP Server",
	},
});

nodeMailin.on("message", (connection: unknown, data: EmailData) => {
	const fromAddress = data.from?.[0]?.address ?? null;
	const toAddress = data.to?.[0]?.address ?? null;
	if (!fromAddress || !toAddress) {
		return;
	}

	console.log(`New email received from ${fromAddress} to ${toAddress}`);
	processEmail(data).catch((error) => {
		console.error(
			"Failed to process email:",
			error instanceof Error ? error.message : "Unknown error",
		);
	});
});

console.log(
	"Mailhook is running! Configured emails:",
	config.mailhook.map((h) => h.email).join(", "),
);
