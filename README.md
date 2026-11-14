# Radiant Images

Photography website with public galleries, service pages, pricing, and an inquiry form, plus an
owner admin area for content, clients, and questionnaires. This pnpm workspace uses React, React
Router, and Tailwind CSS for the frontend, with a Hono API on Cloudflare Workers, D1, and R2.

## Prerequisites

- **Node.js 24.14.0**, matching `.node-version` and CI. `package.json` supports Node
  `>=24.14.0 <25`.
- **pnpm 12.18.0**, pinned in `package.json`.
- **Git** to clone the repository.

If pnpm is not installed, install the pinned version after installing Node:

```sh
npm install --global pnpm@12.18.0
node --version
pnpm --version
```

Wrangler is a workspace dependency. Local development uses emulated D1 and R2 resources; no
Cloudflare login or live resources are needed for the setup below.

## Local setup

### 1. Install dependencies

```sh
git clone https://github.com/sg921216/radiant_images.git
cd radiant_images
pnpm install --frozen-lockfile
```

If you already have a checkout, run the install command from its root. Run all subsequent
commands from the repository root as well.

### 2. Create local environment files

Copy the examples once, keeping any existing local configuration.

PowerShell:

```powershell
Copy-Item apps/api/.dev.vars.example apps/api/.dev.vars
Copy-Item apps/web/.env.example apps/web/.env
```

macOS / Linux:

```sh
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env
```

| File                     | Purpose                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/.env`          | Public browser configuration: `VITE_API_ORIGIN`, `VITE_WEB_ORIGIN`, `VITE_TURNSTILE_SITE_KEY`, and `VITE_PUBLIC_CONTACT_EMAIL`. |
| `apps/api/.dev.vars`     | Server-only Google/Gmail credentials, Turnstile secret, owner allow-list, and authentication/rate-limit keys.                   |
| `apps/api/wrangler.toml` | API/frontend origins and local D1/R2 bindings. Keep the checked-in local resource IDs for this setup.                           |

The example frontend origins match the development servers:

```dotenv
VITE_API_ORIGIN=http://127.0.0.1:8787
VITE_WEB_ORIGIN=http://127.0.0.1:5173
```

The API's `WEB_ORIGIN` is `http://127.0.0.1:5173` and its `API_ORIGIN` is
`http://127.0.0.1:8787`. Use **127.0.0.1**, including in the browser: CORS requires the exact
frontend origin. Restart the affected development server after changing environment files.

Both local environment files are gitignored. Every `VITE_*` value is public and embedded in
browser assets; keep server credentials in `.dev.vars`.

### 3. Initialize the local database

```sh
pnpm --filter @radiant/api db:migrate:local
pnpm --filter @radiant/api db:seed:local
```

Migrations create the local schema. The seed adds synthetic site settings, service copy, FAQs,
and pricing; it does not populate the photo gallery. Seeding uses `INSERT OR IGNORE`, so rerunning
it preserves existing rows. Run migrations again after pulling changes that add migrations.

### 4. Start the application

```sh
pnpm dev
```

| Service           | URL                                      |
| ----------------- | ---------------------------------------- |
| Website           | <http://127.0.0.1:5173>                  |
| Owner admin       | <http://127.0.0.1:5173/admin>            |
| API content check | <http://127.0.0.1:8787/public/bootstrap> |
| API pricing check | <http://127.0.0.1:8787/pricing>          |

The content and pricing endpoints should return JSON after migration and seeding. Stop both
servers with `Ctrl+C`. To run them in separate terminals instead:

```sh
pnpm --filter @radiant/api dev
```

```sh
pnpm --filter @radiant/web dev
```

### What works with the example configuration

The public site and seeded content can be viewed locally. Placeholder credentials do not enable
Google owner sign-in or inquiry/email delivery. The public contact address is also a placeholder.
Ordinary development uses the application's provider integrations; it does not expose the
synthetic sign-in or email endpoints used by browser tests. Portfolio publication uses the
Cloudflare Images binding and a strict JPEG validator, configured in the API Worker. Damaged
or unsupported JPEGs are rejected with re-export guidance before anything is stored. The
Sharp decoder is available only in the isolated E2E setup. Ordinary offline Images emulation
does not establish provider behavior; the feature quickstart includes the live binding probe.
Client photo collections and delivery stay in Pixieset Client Gallery.

Use the automated browser workflow below to exercise sign-in, inquiries, gallery, and owner
workflows with synthetic data and controlled providers. For provider-connected setup, see the
[feature quickstart](specs/001-radiant-images-website/quickstart.md).

## Tests and checks

### Unit, component, and API integration tests

```sh
pnpm test
```

Vitest runs shared-schema, frontend, API, and tooling tests. API tests use local D1/R2 bindings
and controlled external providers; no running development servers or live credentials are needed.

### Browser tests

Stop `pnpm dev` first. Playwright starts its own API on **8787**, built frontend on **4173**,
and local image decoder on **8790**. These ports must be available.

```sh
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm test:setup
pnpm build
pnpm e2e:smoke
```

The browser installation is needed on first setup and after Playwright version changes.
`test:setup` applies migrations to the separate E2E database under `.wrangler/e2e`; the test
server also runs this step automatically. Browser fixtures reset and seed synthetic data for
each test. The harness simulates Google, Gmail, and Turnstile and does not send real email.

`e2e:smoke` runs Chromium desktop/mobile smoke cases. Run the complete configured
Chromium/Firefox/WebKit suite with:

```sh
pnpm e2e
```

Rebuild after application changes before rerunning browser tests. Inspect the HTML report with
`pnpm exec playwright show-report`. Run `pnpm security:artifacts` before sharing test reports.

### Common commands

| Command                      | Purpose                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                  | Run ESLint.                                                                                                    |
| `pnpm typecheck`             | Generate route types and check workspace/tooling TypeScript.                                                   |
| `pnpm format:check`          | Check formatting without changing files.                                                                       |
| `pnpm format`                | Format the repository's non-ignored files.                                                                     |
| `pnpm build`                 | Check shared types, bundle the API with a Wrangler dry run, and build/prerender the frontend. Does not deploy. |
| `pnpm check`                 | Run formatting, lint, type checks, Vitest, and build in sequence. Browser tests run separately.                |
| `pnpm security:secrets`      | Scan repository files for secret patterns.                                                                     |
| `pnpm security:dependencies` | Audit dependencies for moderate-or-higher vulnerabilities.                                                     |

## Troubleshooting

- **API errors or missing tables/content:** run both local migration and seed commands, then
  check `/public/bootstrap`. `pnpm test:setup` prepares the separate E2E database, not the
  interactive development database.
- **CORS errors:** open `http://127.0.0.1:5173`, not `localhost`. If changing ports, update the
  matching frontend and API origins along with the server commands.
- **Port already in use:** stop the existing development/test server. Playwright deliberately
  refuses to reuse an existing server.
- **Sign-in or sending fails with example values:** this is expected. Use the isolated browser
  tests for simulated provider flows, or follow the provider-connected quickstart.
- **Playwright executable missing:** rerun the browser installation command using the installed
  workspace version of Playwright.
- **Install/toolchain mismatch:** verify Node and pnpm against the versions above and install
  with `--frozen-lockfile`.

## Repository map

| Path                                | Contents                                                           |
| ----------------------------------- | ------------------------------------------------------------------ |
| `apps/web/`                         | React frontend and static-assets Worker.                           |
| `apps/api/`                         | Hono Worker, database migrations/seeds, and API tests.             |
| `packages/shared/`                  | Shared schemas, types, and constants.                              |
| `e2e/`                              | Playwright scenarios, isolated Worker configuration, and fixtures. |
| `scripts/`                          | Test setup, local operations, privacy checks, and release tooling. |
| `specs/001-radiant-images-website/` | Feature specification, design, validation, and acceptance records. |

See the [API contract](specs/001-radiant-images-website/contracts/README.md) for endpoint details
and the [acceptance record](specs/001-radiant-images-website/acceptance.md) for known issues and
release gates. Deployment and live-provider acceptance are separate from this local setup.
