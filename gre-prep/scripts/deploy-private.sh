#!/usr/bin/env bash
# Deploy the owner-only build (with the private ETS study material) to its own
# Vercel project. Run from gre-prep/ on the machine that holds gre-prep/private/.
#
#   npm i -g vercel && vercel login          (once)
#   scripts/deploy-private.sh
#
# Why a separate project: the public project builds from Git, which never has the
# private folder. A Git push would replace an owner deployment, so the owner
# build lives in its own project that only this script deploys to.
#
# One-time setup in the Vercel dashboard of the "sar-prep-private" project:
#   PRIVATE_STUDY_EMAILS=simon5.amar@gmail.com      (comma-separated allow-list)
#   plus the same AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, DATABASE_URL as the
#   public project, AUTH_URL=https://<your private domain>, and add
#   https://<your private domain>/api/auth/callback/google as an authorised
#   redirect URI in the Google Cloud console.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d private ] || { echo "gre-prep/private/ not found: nothing to deploy." >&2; exit 1; }
command -v vercel >/dev/null || { echo "Install the Vercel CLI first: npm i -g vercel" >&2; exit 1; }

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
# A staging copy has no .gitignore, so the CLI uploads private/ along with the app.
rsync -a --exclude node_modules --exclude .next --exclude '.env*' --exclude screenshots --exclude .vercel ./ "$STAGE/"
cd "$STAGE"
vercel link --yes --project sar-prep-private
vercel deploy --prod
