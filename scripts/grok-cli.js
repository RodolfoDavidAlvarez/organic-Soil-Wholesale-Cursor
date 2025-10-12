#!/usr/bin/env node

/**
 * Simple Grok CLI helper.
 *
 * Usage examples:
 *   XAI_API_KEY=your_key_here node scripts/grok-cli.js "Write a soil care tip."
 *   npm run grok -- "Summarize the pickup instructions."
 *
 * The script accepts a prompt via CLI args or stdin and prints the first reply.
 */

import { stdin } from 'node:process';

const apiKey =
  process.env.XAI_API_KEY ||
  process.env.XAI_KEY ||
  process.env.GROK_API_KEY ||
  process.env.XAI_TOKEN;

if (!apiKey) {
  console.error(
    'Missing API key. Set XAI_API_KEY (or XAI_KEY/GROK_API_KEY) in your environment.'
  );
  process.exit(1);
}

const args = process.argv.slice(2);

async function readPrompt() {
  if (args.length > 0) {
    return args.join(' ');
  }

  if (stdin.isTTY) {
    console.error('Enter your prompt and press Ctrl+D when finished:');
  }

  let data = '';
  for await (const chunk of stdin) {
    data += chunk;
  }

  return data.trim();
}

async function callGrok(prompt) {
  if (!prompt) {
    console.error('Prompt required. Pass it as an argument or via stdin.');
    process.exit(1);
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '<no body>');
    console.error(
      `Grok API request failed with ${response.status} ${response.statusText}: ${errorText}`
    );
    process.exit(1);
  }

  const payload = await response.json();
  const message = payload?.choices?.[0]?.message?.content;

  if (!message) {
    console.error(
      'Unexpected response format. Full payload:\n',
      JSON.stringify(payload, null, 2)
    );
    process.exit(1);
  }

  console.log(message.trim());
}

try {
  const prompt = await readPrompt();
  await callGrok(prompt);
} catch (error) {
  console.error('Failed to contact Grok:', error);
  process.exit(1);
}

