---
title: "GitHub Code Review Agent Setup Guide"
description: "Learn how to set up the GitHub Code Review Agent to automate your code review process."
---

## Getting Started

To set up the GitHub Code Review Agent, follow these steps to get your application running smoothly.

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v12 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/your-username/github-code-review-agent.git
   ```

2. Navigate to the cloned repository:

   ```bash
   cd github-code-review-agent
   ```

3. Install the necessary dependencies:

   ```bash
   npm install
   ```

{/* Updated step numbering and formatting for clarity and consistency */}

_2. Copy the environment variables file and configure it:_

   ```bash
   cp .env.example .env
   ```_

3. Fill in your `.env` file:

   ```env
   GITHUB_TOKEN=your_github_token
   REPOSITORY_NAME=your_repository_name
   ```

## Configuration

After setting up the environment variables, you need to configure the GitHub Code Review Agent to work with your specific GitHub repository.

1. Open the `.env` file in your favorite text editor.
2. Replace `your_github_token` with your actual GitHub token.
3. Replace `your_repository_name` with the name of the repository you want to review.

## Running the Agent

To start the GitHub Code Review Agent, run the following command in your terminal:

```bash
npm start
```

This will initiate the code review process based on the configurations you've set in your `.env` file.

## Conclusion

You have now successfully set up the GitHub Code Review Agent. It will automatically review code submissions to your specified repository, helping to streamline your code review process.

For further customization and advanced configurations, refer to the [Advanced Configuration Guide](/docs/advanced-configuration).

Remember to keep your `.env` file secure and never share your GitHub token with others.