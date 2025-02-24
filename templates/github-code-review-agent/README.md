# GitHub Code Review Agent
An AI-powered code review bot that automatically reviews pull requests using GPT-4 and provides detailed, line-by-line feedback.

```bash
npx create-spinai
```
and choose the Github-code-reviewer template.


## Features

- 🤖 Automatic PR reviews when opened or updated
- 📝 Line-by-line code feedback
- 🔍 Focuses on:
  - Code quality and best practices
  - Potential bugs and issues
  - Performance considerations
  - Security concerns
- 🎨 Customizable bot name and appearance
- 📊 Review tracking with SpinAI

## Setup

1. Install dependencies:
```bash
npm install
```

_2. Copy the environment variables file and configure it:
```bash
cp .env.example .env
```_

3. Fill in your `.env` file:
```env
# OpenAI API Key for the code review
OPENAI_API_KEY=your_openai_api_key_here

# GitHub Personal Access Token with repo scope
GITHUB_TOKEN=your_github_token_here

# SpinAI API Key for agent tracking and monitoring
SPINAI_API_KEY=your_spinai_api_key_here

# Port for the webhook server (optional)
PORT=3000
```

### Getting the Required API Keys

1. **GitHub Token**:
   - Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
   - Create a new token with `repo` scope
   - This token determines which GitHub account the bot will comment as

2. **OpenAI API Key**:
   - Get your API key from [OpenAI's platform](https://platform.openai.com/api-keys)
   - Make sure you have access to GPT-4

3. **SpinAI API Key**:
   - Get your API key from SpinAI's dashboard

## Setting Up GitHub Webhook

1. Go to your repository's Settings → Webhooks → Add webhook
2. Configure the webhook:
   - Payload URL: Your server URL + `/webhook` (e.g., `https://your-domain.com/webhook`)
   - Content type: `application/json`
   - Secret: (optional) Add a webhook secret for security
   - Events: Select "Pull requests"

For local testing:
```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal, create a tunnel
ngrok http 3000
```

Use the ngrok URL as your webhook URL in GitHub settings.

## Usage

1. Start the server:
```bash
npm run dev
```

2. The bot will automatically:
   - Review new PRs when they're opened
   - Review PRs when new changes are pushed
   - Add line-specific comments with suggestions
   - Add a summary comment on the PR

## Customization

1. **Review Focus**: Edit the prompt in `src/actions/reviewCode.ts`
2. **Comment Style**: Modify the comment formatting in `src/actions/postReviewComments.ts`

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build the project
npm run build

# Run linting
npm run lint

# Type checking
npm run check-types
```

## License

MIT 