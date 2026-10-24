# Vortex dashboard on Render

This repository runs the Vortex web dashboard. It does not contain a WhatsApp bot engine, pairing/session handling, or message handlers. Deploying it will not connect to WhatsApp or execute bot commands.

## Deploy

1. Sync this project's changes to your GitHub repository using Lovable's GitHub sync. The dashboard's GitHub activity connection alone does not sync source code.
2. In Render, choose **New → Blueprint**, connect that repository, and select its branch. Render reads `render.yaml` and builds the Docker image.
3. Review the service plan and price before approving. The blueprint selects a paid Starter web service; change the plan in Render if needed. A free web service can sleep when idle.
4. Wait for deployment to succeed, then open the assigned Render URL. `/api/public/health` should return `{"status":"ok","service":"vortex-dashboard"}`.

For an existing Render service, select the **Docker** runtime, `Dockerfile` in the repository root, and health-check path `/api/public/health`. No custom build or start command is needed: Docker installs from `bun.lock`, builds the app, and starts `.output/server/index.mjs` on Render's assigned `PORT`.

## GitHub activity

To keep the GitHub activity panel connected, configure `LOVABLE_API_KEY` and `GITHUB_API_KEY` in Render's Environment settings using the linked Lovable connection's values. Do not paste keys into source code, GitHub, or chat. These are Lovable gateway credentials, not a GitHub personal access token. If they are unavailable, the dashboard still loads, but GitHub activity cannot load. This project does not require MongoDB or a Discord bot token.

## Verification and limits

The application checks menus locally and exposes a health check that does not depend on GitHub. A successful local preview does not prove a Render deployment has completed. Check Render's deployment logs and the deployed health URL after publishing there. To diagnose the actual WhatsApp bot, provide its source repository or upload its source files and Render error logs, without secrets or session files.