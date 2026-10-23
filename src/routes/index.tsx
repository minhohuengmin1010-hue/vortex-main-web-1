import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRepoSummary } from "@/lib/github.functions";
import { MENUS, PREFIX } from "@/lib/menus";

const repoQuery = queryOptions({
  queryKey: ["repo"],
  queryFn: () => getRepoSummary(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vortex Bot Dashboard" },
      { name: "description", content: "Control center for the Vortex WhatsApp group bot: menus, commands and GitHub activity." },
      { property: "og:title", content: "Vortex Bot Dashboard" },
      { property: "og:description", content: "Menus, commands and live GitHub activity for the Vortex WhatsApp bot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function timeAgo(iso: string) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function Dashboard() {
  const { data, isLoading, error } = useQuery(repoQuery);
  const [active, setActive] = useState(MENUS[0]!.id);
  const [search, setSearch] = useState("");
  const menu = MENUS.find((m) => m.id === active) ?? MENUS[0]!;
  const totalCmds = MENUS.reduce((n, m) => n + m.commands.length, 0);
  const q = search.toLowerCase();
  const filtered = search
    ? MENUS.flatMap((m) => m.commands.filter((c) => c.cmd.includes(q) || m.title.toLowerCase().includes(q)).map((c) => ({ ...c, menu: m })))
    : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <header className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0">
          <div className="absolute inset-0 rounded-full bg-vortex animate-spin-slow glow" />
          <div className="absolute inset-[3px] grid place-items-center rounded-full bg-background font-mono text-lg font-bold text-primary">V</div>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold md:text-3xl"><span className="text-vortex">Vortex</span> Control</h1>
          <p className="truncate font-mono text-xs text-muted-foreground">WhatsApp group bot · prefix “{PREFIX}”</p>
        </div>
        <span className="ml-auto flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-success">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> online
        </span>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Menus" value={MENUS.length} />
        <Stat label="Commands" value={totalCmds} />
        <Stat label="Last push" value={data ? timeAgo(data.pushedAt) : "…"} />
        <Stat label="Open issues" value={data?.issues ?? "…"} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="panel min-w-0 p-4 md:p-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any command…"
            className="w-full rounded-lg border border-input bg-background/60 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {filtered ? (
            <ul className="mt-4 space-y-2">
              {filtered.length === 0 && <li className="text-sm text-muted-foreground">No commands found.</li>}
              {filtered.map((c) => <CmdRow key={c.menu.id + c.cmd} cmd={c.cmd} desc={`${c.menu.emoji} ${c.desc}`} />)}
            </ul>
          ) : (
            <>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
                {MENUS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActive(m.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${m.id === active ? "border-transparent bg-vortex font-semibold text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {m.emoji} {m.title}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold">{menu.emoji} {menu.title} menu</h2>
                <span className="font-mono text-xs text-muted-foreground">{menu.commands.length} cmds</span>
              </div>
              <p className="text-sm text-muted-foreground">{menu.blurb}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {menu.commands.map((c) => <CmdRow key={c.cmd} cmd={c.cmd} desc={c.desc} />)}
              </ul>
            </>
          )}
        </section>

        <aside className="panel min-w-0 p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">GitHub activity</h2>
            {data && <a href={data.url} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary hover:underline">open repo ↗</a>}
          </div>
          {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="mt-4 text-sm text-destructive">Couldn't reach GitHub.</p>}
          {data && (
            <>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{data.name} · {data.branch} · ★ {data.stars} · ⑂ {data.forks}</p>
              <ol className="mt-4 space-y-3">
                {data.commits.length === 0 && <li className="text-sm text-muted-foreground">No commits yet.</li>}
                {data.commits.map((c) => (
                  <li key={c.sha} className="border-l-2 border-primary/50 pl-3">
                    <a href={c.url} target="_blank" rel="noreferrer" className="line-clamp-2 break-all text-sm hover:text-primary">{c.message}</a>
                    <p className="font-mono text-[11px] text-muted-foreground">{c.sha} · {c.author} · {timeAgo(c.date)}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function CmdRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2">
      <code className="font-mono text-sm font-semibold text-primary">{PREFIX}{cmd}</code>
      <span className="truncate text-sm text-muted-foreground">{desc}</span>
    </li>
  );
}
