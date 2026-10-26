# Vortex on Render — native Node.js

This repository contains two separate services: the Vortex dashboard and the original Node.js bot under `services/vortex-bot`. Neither uses Docker. The dashboard's reference menus do not mean every command is implemented in the bot. The bot currently implements `.menu`, `.help`, `.ping`, `.alive`, `.info`, `.owner`, `.support`, `.rules`, and owner-only `.groupid`.

## Deploy

1. Sync this project's changes to your GitHub repository using Lovable's GitHub sync. The dashboard's GitHub activity connection alone does not sync source code.
2. In Render, choose **New → Blueprint**, connect that repository, and select its branch. Render reads `render.yaml` and creates two **Node** web services.
3. Review both Starter service prices and the bot's persistent disk price before approving. The disk preserves encrypted WhatsApp credentials across restarts; do not run multiple bot instances against one disk. Free services sleep and do not support this persistent disk setup.
4. Set `PAIRING_SITE_ORIGIN` to the dashboard's HTTPS origin, and `ALLOWED_GROUP_JIDS` to your permitted WhatsApp group IDs (comma-separated, ending in `@g.us`). The invite links are not group IDs. Only the owner number is approved initially; add other consenting numbers to `ALLOWED_PAIR_NUMBERS` explicitly.
5. Wait for deployment to succeed. Dashboard `/api/public/health` returns `{"status":"ok","service":"vortex-dashboard"}`; bot `/health` returns `{"status":"ok","service":"vortex-bot"}`. These checks do not claim WhatsApp is connected.

For an existing Docker service, create a new **Node** web service instead (Render does not switch an existing service's runtime). Dashboard: root directory blank, build `bun install --frozen-lockfile && bun run build`, start `node .output/server/index.mjs`, health `/api/public/health`, `HOST=0.0.0.0`. Bot: root `services/vortex-bot`, build `bun install --frozen-lockfile`, start `node src/server.mjs`, health `/health`. Set `NODE_VERSION=22.22.2` and `BUN_VERSION=1.4.4` on both. Node runs both services; Bun only installs dependencies and builds the dashboard.

## Pair your own WhatsApp account

Render generates `AUTH_ENCRYPTION_KEY` and `PAIRING_ACCESS_TOKEN` as private values. Keep the encryption key unchanged after pairing. Do not put either value in GitHub, screenshots, or chat. The pairing API requires the access token and only allows approved numbers. It is not an open public pairing site.

From a trusted local API client, send `POST https://YOUR-BOT-URL/pair` with header `Authorization: Bearer YOUR_PAIRING_ACCESS_TOKEN`, `Content-Type: application/json`, and body `{"phone":"2349016077157","consent":true}`. Supply your real Render URL and token locally, not in source. WhatsApp → Linked devices → Link with phone number → enter the returned code. The code is temporary; a new request after expiry returns a new one. `POST /status` with the same authorization and phone body reports the account connection state. `POST /unlink` with authorization and phone body disconnects the account and removes local credentials.

Only link accounts you own. Approved group replies are opt-in; the service does not auto-join invite links, send broadcasts, or reply to old message history. WhatsApp may restrict unofficial automation; Baileys is not an official WhatsApp product.

`SESSION_ID` is optional and only accepts this service's documented `Vortex~` version-1 bundle format. Third-party `Silva~` strings are incompatible. Fresh pairing is the supported setup: never use the session previously exposed in chat; revoke that linked device in WhatsApp first. Session export and a public self-service pairing website are not implemented.

## GitHub activity

To keep the GitHub activity panel connected, configure `LOVABLE_API_KEY` and `GITHUB_API_KEY` in Render's Environment settings using the linked Lovable connection's values. Do not paste keys into source code, GitHub, or chat. These are Lovable gateway credentials, not a GitHub personal access token. If they are unavailable, the dashboard still loads, but GitHub activity cannot load. This project does not require MongoDB or a Discord bot token.

## Verification and limits

Local tests verify startup, health responses, access checks, encrypted storage, and basic command behavior. A live WhatsApp pairing still needs an approved account to enter a code, and a live Render deployment still needs your repository connection, environment settings, service approval, and deployed health URL. Full Aidoru feature parity is not verified or implemented; no unlicensed code or media has been copied. Existing original card, creature-battle, anime-battle, and welcome art lives in the dashboard, not in bot battle handlers.