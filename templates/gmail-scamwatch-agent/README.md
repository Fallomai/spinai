# Sparky: Gmail Scam Detection Assistant

Sparky is an advanced scam detection assistant designed to analyze Gmail messages, identify potential scams, and take appropriate actions such as reporting phishing attempts and moving suspicious emails to the Spam folder.

## Features

- **Email Analysis**: Evaluates email metadata and content to detect phishing and fraudulent activities.
- **Automated Actions**: Automatically reports confirmed phishing emails and moves suspicious messages to the Spam folder.
- **Customization**: Easily configurable to adjust detection sensitivity and define trusted sources.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed on your system.
- **Google Cloud Project**: A project with the Gmail API enabled. If you haven't set this up, follow the [Gmail API Node.js Quickstart](https://developers.google.com/gmail/api/quickstart/nodejs) guide.

## Getting Started

1. Install dependencies:

```bash
npm install
```
2. Copy the environment variables file and configure it:

```bash
cp .env.example .env
```

3. Fill in your `.env` file:
```env
# Google API Key - https://aistudio.google.com/apikey
GEMINI_API_KEY="your-google-ai-studio-api-key"

# Gmail API Credentials
# Helpful Links:
# - https://console.developers.google.com/
# - https://console.cloud.google.com/apis/api/gmail.googleapis.com
GMAIL_CLIENT_ID='your_client_id'
GMAIL_CLIENT_SECRET='your_client_secret'
GMAIL_REDIRECT_URI='your_redirect_uri'
GMAIL_REFRESH_TOKEN='your_refresh_token'

# SpinAI Api Key - https://app.spinai.dev/credentials (Optional)
SPINAI_API_KEY='your-spinai-api-
```

## How to get the Gmail Refresh Token
Follow the steps in the video below.


https://github.com/user-attachments/assets/a6a9344b-7372-49ec-9757-cf6b2bbd96b6

⚠️ Copy the "Refresh token" Not the "Access token"


### 4. Run Sparky

```bash
npm start
```

Sparky will start analyzing your Gmail inbox for potential scams and take appropriate actions based on its analysis.

## Usage

Sparky operates based on predefined rules to assess incoming emails. You can customize these rules in the `scamWatchAgent` configuration within the code to better suit your needs.
