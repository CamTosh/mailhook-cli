# Mailhook CLI

After running [mailhook.app](https://mailhook.app) as a SaaS for 4.5 wonderful years, I've decided to make this simplified version available for free. This CLI tool provides the core functionality of Mailhook: receiving emails and forwarding them to webhooks.

## Features

- 📨 SMTP Server for receiving emails
- 🔄 Forward emails to webhook endpoints
- 📎 Support for email attachments (via S3)
- ⚡️ Easy configuration with JSON
- 🔒 Secure and reliable email processing

## Installation

```bash
npm install -g mailhook-cli
```

## Quick Start

1. Create a configuration file:

```bash
# Create config.json in your project directory
{
  "mailhook": [
    {
      "email": "notifications@yourdomain.com",
      "webhook": "https://api.example.com/webhook",
      "method": "POST", # Optional, defaults to POST
      "forwardAttachments": true
    }
  ]
}
```

2. If using attachments, configure AWS (optional):

```bash
# .env file
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket
```

3. Start the server:

```bash
mailhook
```

## Configuration Options

### Email Hook Configuration

Each hook in the `mailhook` array supports:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address to receive mail |
| `webhook` | string | Yes | Endpoint to forward emails |
| `method` | string | No | HTTP method (GET/POST, defaults to POST) |
| `forwardAttachments` | boolean | No | Enable S3 attachment forwarding |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_PORT` | No | SMTP port (default: 25) |
| `AWS_*` | If using attachments | AWS credentials for S3 |

## Webhook Payload

Mailhook sends the following JSON payload to your webhook:

```typescript
{
  "id": string,                // Unique identifier
  "received_at": string,       // ISO timestamp
  "from": string[],            // Sender email addresses
  "to": string[],              // Recipient email addresses
  "subject": string,           // Email subject
  "text": string,              // Plain text content
  "html": string | null,       // HTML content if available
  "attachments": [             // Only if forwardAttachments is true
    {
      "filename": string,
      "size": number,
      "contentType": string,
      "url": string            // S3 public URL
    }
  ]
}
```

## Requirements

- Node.js 14 or later
- Available SMTP port (default: 25)
- AWS account (only for attachment handling)

## Common Use Cases

- Receive notifications from services that only support email
- Build email automation workflows
- Test email-based features
- Process incoming emails in your applications
- Create email-to-webhook bridges

## Development

```bash
# Clone the repository
git clone https://github.com/camtosh/mailhook-cli

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```

## Troubleshooting

### Common Issues

1. **Attachments not working**
   - Verify AWS credentials
   - Ensure S3 bucket has proper permissions
   - Check `forwardAttachments` is enabled

## Future Improvements

- [ ] Email filtering options
- [ ] Email validation rules
- [ ] Custom HTTP headers support
- [ ] Retry mechanisms for failed webhooks

## License

This project is licensed for personal and non-commercial use only. Commercial use requires explicit permission. See [LICENSE](LICENSE) for details.

For commercial licensing: `tochecamille@gmail.com`

## Support

- Create an issue for bug reports
- For security concerns, email directly
- Commercial support available upon request

## Acknowledgements

Thank you to all Mailhook customers who supported this project. This open-source version is dedicated to you.

---

Made with ❤️ by [Camille Toche](mailto:tochecamille@gmail.com)
