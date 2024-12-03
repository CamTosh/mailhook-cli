export type EmailAddress = {
	address: string;
	name?: string;
};

export type EmailAttachment = {
	filename: string;
	content: Buffer;
	contentType: string;
	size: number;
};

export type ProcessedAttachment = Omit<EmailAttachment, "content"> & {
	url: string;
};

export type EmailData = {
	to: EmailAddress[];
	from: EmailAddress[];
	date: Date;
	subject?: string;
	text?: string;
	html?: string;
	attachments?: EmailAttachment[];
};

export type MailhookConfig = {
	mailhook: Array<{
		email: string;
		webhook: string;
		forwardAttachments: boolean;
		method?: "GET" | "POST";
	}>;
};
