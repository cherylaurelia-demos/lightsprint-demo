import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import askAfterUpgrade from "../evidence/claude-ask-0.6.4.json";
import askNew from "../evidence/claude-ask-0.7.0.json";

const REPO_URL = "https://github.com/cherylaurelia/lightsprint-demo";
const PATCH_URL = "/lightsprint-upgrade-guard.patch";
const PLUGIN_REPO = "https://github.com/SprintsAI/lightsprint-claude-code-plugin";

function evidence(name: string): string {
  return readFileSync(join(process.cwd(), "evidence", name), "utf-8");
}

// Lines [from, to] of a log, 1-based and inclusive, so the excerpts match the files in the repo.
function lines(text: string, from: number, to: number): string {
  return text.split("\n").slice(from - 1, to).join("\n");
}

// Claude replies are markdown; the quote shows them as plain text.
function plain(markdown: string): string {
  return markdown.replaceAll("**", "").replaceAll("`", "");
}

function Log({ title, children }: { title: string; children: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-card">
      <figcaption className="border-b border-line bg-soft px-4 py-2 font-mono text-xs text-muted">{title}</figcaption>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed whitespace-pre">{children}</pre>
    </figure>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <p className="font-mono text-xs tracking-wide text-spark-ink uppercase">{n}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function Page() {
  const repro = evidence("repro.log");
  const after = evidence("after.log");
  const check = evidence("check.log");
  const patch = evidence("lightsprint-upgrade-guard.patch");
  const guardFile = patch.slice(patch.indexOf("diff --git a/scripts/ls-cli.js")).split("\n-- \n")[0];
  const guardHunk = guardFile.slice(guardFile.indexOf("@@"));

  return (
    <main className="mx-auto max-w-3xl px-5 pt-14 pb-20 sm:pt-20">
      <p className="font-mono text-xs text-muted">Lightsprint Claude Code plugin · reproduced 2026-11-19 (UTC) from a fresh HOME</p>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        A fresh install can&apos;t run <code className="font-mono text-spark-ink">/lightsprint:ask</code>, and{" "}
        <code className="font-mono">lightsprint upgrade</code> unhooks the plugin.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        <strong className="text-ink">Problem:</strong> the README installer downloads the CLI from the latest release (v0.6.4, June 23),
        while Claude Code installs the skills from main, and main&apos;s ask skill calls <code className="font-mono">lightsprint session</code>,
        which no release has yet.
      </p>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        <strong className="text-ink">Fix:</strong> tagging v0.7.0 is your call and fixes the session part. Separately, a one-line guard keeps{" "}
        <code className="font-mono">upgrade</code> from pointing Claude Code at a folder that holds only the binary.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <a href={PATCH_URL} className="rounded-lg bg-spark px-4 py-2.5 text-sm font-medium text-white hover:bg-spark-ink">
          Patch (2 files + test)
        </a>
        <a href={REPO_URL} className="rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-medium hover:border-ink">
          Demo repo, logs and repro script
        </a>
      </div>

      <Step n="1 · what a new user sees" title="/lightsprint:ask fails on the CLI the installer just downloaded">
        <p>
          I ran <code className="font-mono">install.sh</code> (the README&apos;s curl fallback; <code className="font-mono">npx lightsprint</code> pipes
          the same script) in an empty HOME. The plugin from main lands in <code className="font-mono">0.7.0/</code>, and the release binary sits alone
          in <code className="font-mono">0.6.4/bin</code>:
        </p>
        <Log title="evidence/repro.log, lines 27–39">{lines(repro, 27, 39)}</Log>
        <p>Then, in a real Claude Code session with that plugin folder loaded (session {askNew.session_id.slice(0, 8)}), Claude answered:</p>
        <blockquote className="rounded-xl border-l-4 border-spark bg-card px-4 py-3 text-[14px] whitespace-pre-line text-ink">
          {plain(askNew.result.split("\n\nTo fix it")[0])}
        </blockquote>
        <p>
          It then suggests <code className="font-mono">lightsprint upgrade</code>. The ask command went into main on Aug 20 (#91) and became{" "}
          <code className="font-mono">session</code> in #125, but neither has been in a release.
        </p>
      </Step>

      <Step n="2 · the suggested remedy" title="upgrade says “Already up to date” and points Claude Code at an empty plugin">
        <p>
          On the &ldquo;already up to date&rdquo; path, <code className="font-mono">ensureInstalledPluginsJson</code> rewrites{" "}
          <code className="font-mono">installed_plugins.json</code> to <code className="font-mono">cache/…/0.6.4</code>, the folder the installer
          filled with only <code className="font-mono">bin/</code>. Claude Code still lists the plugin as enabled:
        </p>
        <Log title="evidence/repro.log, lines 41–63">{lines(repro, 41, 63)}</Log>
        <p>With that folder as the plugin (session {askAfterUpgrade.session_id.slice(0, 8)}), the skill no longer exists at all:</p>
        <blockquote className="rounded-xl border-l-4 border-line bg-card px-4 py-3 text-[14px] text-ink">
          {plain(askAfterUpgrade.result.split("\n\n")[0])}
        </blockquote>
        <p>The same goes for the other 17 skills and all 10 hooks (task sync, PR linking), since they live in the 0.7.0 folder.</p>
      </Step>

      <Step n="3 · the patch" title="Only repoint when the target folder has a plugin manifest">
        <Log title="scripts/ls-cli.js">{guardHunk.trim()}</Log>
        <p>
          New test <code className="font-mono">scripts/__tests__/upgrade-installed-plugins.test.js</code> builds the exact layout install.sh leaves.
          It fails on main and passes with the guard, and the full suite passes (298 tests, bun 1.4.4). The same install, with the CLI rebuilt from
          the patch as v0.6.4:
        </p>
        <Log title="evidence/after.log">{after.trim()}</Log>
      </Step>

      <Step n="4 · catching it next time" title="A 29-line check: do the skills call commands the release has?">
        <p>
          <code className="font-mono">scripts/check-skills-vs-release.js</code> reads <code className="font-mono">lightsprint describe</code> from a
          binary and every <code className="font-mono">lightsprint …</code> call in <code className="font-mono">skills/</code>. Run against the
          latest release before merging skill changes, it would have flagged this on Aug 20:
        </p>
        <Log title="evidence/check.log">{check.trim()}</Log>
        <p className="text-sm">
          Not covered by the check: new flags on existing commands. <code className="font-mono">agent launch --auto-merge</code> (#79),{" "}
          <code className="font-mono">update --requires-schema-change</code> (#75) and <code className="font-mono">link-pr --force</code> (#71) are
          also on main and in no release.
        </p>
      </Step>

      <section className="mt-14 rounded-xl border border-line bg-card p-5 text-sm leading-relaxed text-muted">
        <h2 className="font-semibold text-ink">How this was checked</h2>
        <p className="mt-2">
          Everything ran on macOS arm64 with Claude Code 2.1.327, using {""}
          <a className="underline" href={PLUGIN_REPO}>SprintsAI/lightsprint-claude-code-plugin</a> at main (f9eea01) and the v0.6.4 release binary
          (sha256 09ab62d8…). No Lightsprint account was used, so nothing here touched your API. <code className="font-mono">evidence/repro.sh</code>{" "}
          re-runs steps 1–2 in any empty folder. It&apos;s a finding from a fresh install, not a user report.
        </p>
      </section>

      <footer className="mt-12 border-t border-line pt-6 text-sm text-muted">
        Unofficial demo by Cheryl Aurelia: not affiliated with Lightsprint.
      </footer>
    </main>
  );
}
