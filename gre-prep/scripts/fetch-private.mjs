/* Fetches the private study material at build time on hosts that cannot read
 * the private git submodule (Vercel only supports public submodules).
 *
 * With PRIVATE_REPO_TOKEN set (a fine-grained, read-only token for the private
 * repository), the repository is cloned into ./private and its .git folder is
 * removed, so the token is never kept. Without the token, or when ./private is
 * already populated (a local checkout), nothing happens. A failure never fails
 * the build: the owner-only pages then simply stay hidden. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const REPO = process.env.PRIVATE_REPO ?? 'SARx613/SAR-Prep-private';
const token = process.env.PRIVATE_REPO_TOKEN;

if (fs.existsSync('private/allowed-emails.json')) {
  console.log('fetch-private: private material already present');
} else if (!token) {
  console.log('fetch-private: no PRIVATE_REPO_TOKEN, skipping');
} else {
  try {
    fs.rmSync('private', { recursive: true, force: true });
    execFileSync('git', ['clone', '--depth', '1', '--quiet', `https://x-access-token:${token}@github.com/${REPO}.git`, 'private'], { stdio: 'pipe' });
    fs.rmSync('private/.git', { recursive: true, force: true });
    console.log('fetch-private: private material fetched');
  } catch {
    console.log('fetch-private: could not fetch the private material (check the token); continuing without it');
  }
}
