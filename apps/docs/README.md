---
title: Mintlify Starter Kit
description: A comprehensive guide to getting started with the Mintlify Starter Kit, including development, publishing, and troubleshooting tips.
---

# Mintlify Starter Kit

Click on `Use this template` to copy the Mintlify starter kit. The starter kit contains examples including:

- Guide pages
- Navigation
- Customizations
- API Reference pages
- Use of popular components

## Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. To install, use the following command:

```bash
npm i -g mintlify
```

Run the following command at the root of your documentation (where mint.json is):

```bash
mintlify dev
```

## Publishing Changes

Install our GitHub App to auto-propagate changes from your repo to your deployment. Changes will be deployed to production automatically after pushing to the default branch. Find the link to install on your dashboard.

## Troubleshooting

- If `mintlify dev` isn't running, run `mintlify install` to re-install dependencies.
- If a page loads as a 404, make sure you are running in a folder with `mint.json`.

Suggested Structure:

```json
{
  "title": "",
  "sections": [],
  "examples": []
}
```

Related Documentation:

No related documentation