<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render deploys the dashboard and separate bot as native Node web services; both use Render's PORT and bind all interfaces, avoiding Docker.
- Use bun.lock with frozen Bun installs for reproducible builds; do not introduce a second package-manager lockfile.
- Keep deployment health checks public, read-only, and independent of third-party credentials so external outages do not restart the service.
- Keep the native WhatsApp runtime under services/vortex-bot outside the dashboard import graph; dashboard menus are references, not proof of implemented bot handlers or live status.
