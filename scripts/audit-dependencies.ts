import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseAllDocuments } from 'yaml';

const advisoryId = 'GHSA-fc5q-39xc-vjpf';
const patchedPackage = 'picomatch@4.0.7';
const patchHash = 'b87ae23dd308addb842ad0f950fcd9d96b0c2e98e8ed2e9246b592787fd85d02';

interface Advisory {
  github_advisory_id: string;
  module_name: string;
  patched_versions: string | null;
  findings: { version: string; dev: boolean }[];
}

interface WorkspaceLock {
  patchedDependencies?: Record<string, string>;
  snapshots: Record<string, unknown>;
}

export function coveredByPicomatchPatch(advisories: Advisory[], lock?: WorkspaceLock): boolean {
  if (advisories.length !== 1) return false;
  const [finding] = advisories;
  if (
    finding?.github_advisory_id !== advisoryId ||
    finding.module_name !== 'picomatch' ||
    finding.patched_versions !== null ||
    !finding.findings.length ||
    !finding.findings.every((entry) => entry.dev === true && entry.version === '4.0.7')
  )
    return false;
  if (lock?.patchedDependencies?.[patchedPackage] !== patchHash) return false;
  const copies = Object.keys(lock.snapshots).filter(
    (name) => name === patchedPackage || name.startsWith(`${patchedPackage}(`),
  );
  return copies.length === 1 && copies[0] === `${patchedPackage}(patch_hash=${patchHash})`;
}

function audit() {
  const cli = process.env.npm_execpath;
  if (!cli) throw new Error('Run pnpm security:dependencies from the repository root.');
  const args = ['audit', '--audit-level=moderate', '--json'];
  const script = /\.[cm]?js$/i.test(cli);
  const result = spawnSync(script ? process.execPath : cli, script ? [cli, ...args] : args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (result.error) throw result.error;
  if (result.status === 1) {
    const report = JSON.parse(result.stdout);
    const advisories: Advisory[] = Object.values(report.advisories ?? {});
    const documents = parseAllDocuments(readFileSync('pnpm-lock.yaml', 'utf8'));
    const lock = documents.find((doc) => doc.hasIn(['importers', 'apps/web']))?.toJS();
    if (!report.error && coveredByPicomatchPatch(advisories, lock)) {
      console.log(
        `${advisoryId}: covered by the locked development-only picomatch patch. No other blocking advisories.`,
      );
      return 0;
    }
  }
  process.stdout.write(result.stdout);
  return result.status ?? 1;
}

if (import.meta.main) process.exitCode = audit();
