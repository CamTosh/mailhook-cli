declare module "node-mailin" {
	interface MailinOptions {
		port: number;
		logLevel: string;
		smtpOptions: {
			banner: string;
			disableDNSValidation?: boolean;
		};
	}

	interface NodeMailin {
		start: (options: MailinOptions) => void;
		on: (
			event: string,
			callback: (connection: unknown, data: any) => void,
		) => void;
	}

	const mailin: NodeMailin;
	export default mailin;
}
