declare module "node-mailin" {
	interface SmtpOptions {
		banner?: string;
	}

	interface MailinOptions {
		port: number;
		logLevel?: "silent" | "info" | "debug";
		smtpOptions?: SmtpOptions;
	}

	interface Mailin {
		start: (options: MailinOptions) => void;
		on: (
			event: string,
			callback: (connection: unknown, data: any) => void,
		) => void;
	}

	const mailin: Mailin;
	export = mailin;
}
