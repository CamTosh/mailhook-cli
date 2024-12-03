import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import type { EmailAttachment } from "../types";

export class S3Service {
	private s3: AWS.S3;

	constructor() {
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
			throw new Error(
				`AWS credentials required. Missing: ${missingEnvVars.join(", ")}`,
			);
		}

		this.s3 = new AWS.S3({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: process.env.AWS_REGION,
		});
	}

	async uploadFile(attachment: EmailAttachment): Promise<string> {
		const key = `${nanoid()}/${attachment.filename}`;

		await this.s3
			.upload({
				Bucket: process.env.AWS_BUCKET_NAME!,
				Key: key,
				Body: attachment.content,
				ContentType: attachment.contentType,
				ACL: "public-read",
			})
			.promise();

		return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
	}
}
