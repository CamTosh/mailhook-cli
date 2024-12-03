import fs from "node:fs";
import path from "node:path";
import type { MailhookConfig } from "./types";

export function loadConfig(): MailhookConfig {
	const configPath = path.join(process.cwd(), "config.json");

	if (!fs.existsSync(configPath)) {
		throw new Error("config.json not found in current directory");
	}

	try {
		const configFile = fs.readFileSync(configPath, "utf8");
		const parsedConfig = JSON.parse(configFile) as MailhookConfig;

		if (!Array.isArray(parsedConfig.mailhook)) {
			throw new Error("Invalid config format: mailhook must be an array");
		}

		return parsedConfig;
	} catch (error) {
		throw new Error(
			`Error loading config.json: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
