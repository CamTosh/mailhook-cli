# Mailhook CLI

After running [mailhook.app](https://mailhook.app) as a SaaS for 4.5 wonderful years, I've decided to make this simplified version available for free to thank all our customers who trusted us. This CLI tool provides the core functionality of Mailhook: receiving emails and forwarding them to webhooks.

## What is Mailhook?

Mailhook is a simple tool that receives emails and forwards them to your webhook endpoints. It's perfect for:
- Receiving notifications from services that only support email
- Building email automation workflows
- Testing email-based features
- Processing incoming emails in your applications

## Installation

```bash
npm install -g mailhook-cli
```

## Configuration

1. Create a `config.json` file in your project directory:

```json
{
  "mailhook": [
    {
      "email": "notifications@yourdomain.com",
      "webhook": "https://your-api.com/webhook",
      "forwardAttachments": true
    },
    {
      "email": "support@yourdomain.com",
      "webhook": "https://your-api.com/support-webhook",
      "forwardAttachments": false
    }
  ]
}
```

2. If you're using attachment forwarding, create a `.env` file with your AWS credentials:

```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket
```

Note: AWS credentials are only required if you set `forwardAttachments: true` for any email configuration.

## Usage

```bash
mailhook
```

This will start an SMTP server on port 25. Make sure this port is available and your server is properly configured to receive emails.

## Webhook Payload

When an email is received, Mailhook will send a POST request to your webhook URL with this payload:

```json
{
  "id": "unique_id",
  "received_at": "2024-01-20T10:00:00Z",
  "from": "sender@example.com",
  "to": "your-configured-email@yourdomain.com",
  "subject": "Email Subject",
  "text": "Plain text content",
  "html": "<p>HTML content</p>",
  "attachments": [
    {
      "filename": "document.pdf",
      "size": 123456,
      "contentType": "application/pdf",
      "url": "https://your-s3-bucket.s3.region.amazonaws.com/path/document.pdf"
    }
  ]
}
```

## From SaaS to Open Source

This tool is a simplified version of the Mailhook SaaS that served customers for over 4 years. While it doesn't include all the features of the SaaS version (like a dashboard, email filtering, Gmail, Outlook, Protonmail connection or advanced routing), it provides the core functionality that made Mailhook useful.

## Requirements

- Node.js 14+
- SMTP port 25 available
- AWS account (only if you need attachment forwarding)

## Roadmap

- Different HTTP verb, for some automation tool you need a GET call
- Handle the multiples `from` and `to` email address
- Env var for SMTP server

## License

This project is licensed for personal and non-commercial use only. Commercial use requires explicit permission from the author. See the [LICENSE](LICENSE) file for details.

For commercial licensing inquiries, please contact: `tochecamille@gmail.com`

## Thank You

A huge thank you to all Mailhook customers who supported this project over the years. This open-source version is dedicated to you.

---
Made with ❤️ by [Camille Toche](mailto:tochecamille@gmail.com)
