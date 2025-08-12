#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Run Smithery CLI start command
const child = spawn('npx', ['@smithery/cli', 'start'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Failed to start gemini-imagen4:', error);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code);
});