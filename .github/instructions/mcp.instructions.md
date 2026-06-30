---
description: 'Use when crafting prompts, selecting tools, or troubleshooting MCP server issues. Covers all MCP servers (github, playwright, sequential-thinking, fetch, context7, minio, docker) — what they do, when to invoke them, and Gotchas.'
applyTo: ['.vscode/mcp.json', 'docker-compose.yml']
---

# MCP Servers (Audiobooker Harness)

This project uses 7 MCP servers to extend Copilot capabilities. 3 run locally via `npx` stdio (defined in `.vscode/mcp.json`), and 4 run as Docker services (defined in `docker-compose.yml`). Additionally, the **GitHub MCP** is available via the VS Code GitHub integration.

## Built-in MCP: GitHub (via VS Code)

### github — GitHub Issues, PRs, Files, Search

- **Provider**: Built into VS Code GitHub integration
- **Purpose**: Create/update issues, manage pull requests, push files, search code — the backbone of the handoff pipeline
- **When to use**: **ALWAYS** — all handoff cards, epics, and sub-issues go through this MCP. Also for PR creation, code review, and file uploads.
- **Key tools**:
  | Tool | Purpose |
  |------|---------|
  | `mcp_github_mcp_se_issue_write` | Create or update issues (method: `create` / `update`) |
  | `mcp_github_mcp_se_sub_issue_write` | Add/remove/reprioritize sub-issues |
  | `mcp_github_mcp_se_create_or_update_file` | Create or update a single file in the repo |
  | `mcp_github_mcp_se_push_files` | Push multiple files in a single commit |
  | `mcp_github_mcp_se_create_pull_request` | Create a pull request |
  | `mcp_github_mcp_se_merge_pull_request` | Merge a pull request |
  | `mcp_github_mcp_se_search_issues` | Search issues by query |
  | `mcp_github_mcp_se_search_code` | Search code in the repository |
  | `mcp_github_mcp_se_pull_request_review_write` | Create/submit/delete PR reviews |
  | `mcp_github_mcp_se_get_copilot_job_status` | Check Copilot coding agent job status |
  | `mcp_github_mcp_se_request_copilot_review` | Request Copilot code review on a PR |
- **Gotcha**: Always use `owner: "ZanettiLG"` and `repo: "Audiobooker"`. For file operations, specify the branch explicitly.

### Image Upload via GitHub MCP

To embed images in GitHub Issues (handoff cards, research evidence):

```
1. Capture screenshot (via Playwright MCP or other tool)
2. mcp_github_mcp_se_create_or_update_file(
     owner: "ZanettiLG", repo: "Audiobooker",
     branch: "feat/my-feature",
     path: "docs/screenshots/<slug>-<phase>-<desc>.png",
     content: "<base64-encoded-image>",
     message: "docs: add screenshot for <description>"
   )
3. Reference in issue body:
   ![description](https://raw.githubusercontent.com/ZanettiLG/Audiobooker/<branch>/docs/screenshots/<file>.png)
```

**Conventions:**

- Path: `docs/screenshots/<slug>-<phase>-<description>.png`
- Format: PNG preferred, keep under 2MB
- Branch: Feature branch (not master), so images stay scoped

## Local MCP Servers (stdio via `.vscode/mcp.json`)

### mui — Material UI Docs

- **Package**: `@mui/mcp` v0.1.0 (official MUI team)
- **Purpose**: Query MUI component APIs, props, theming, and usage patterns
- **When to use**: Frontend UI tasks, MUI v6 component questions, theming with Emotion, styling patterns
- **Tools**: `get_component_docs`, `search_components`, `get_theming_guide`
- **Gotcha**: Targets MUI v6 (the project version). Older v5 APIs may differ.

### minio — Storage Operations

- **Package**: `mcp-minio` v1.0.7
- **Purpose**: CRUD on the Audiobooker bucket (projects metadata, markdown files)
- **When to use**: Debugging storage issues, inspecting project JSON, verifying uploaded files
- **Tools**: `listBuckets`, `listFiles`, `getFileContent`, `uploadFile`, `createBucket`, `getFileUrl`
- **Env vars**: `MINIO_ENDPOINT=localhost`, `MINIO_PORT=9000`, `MINIO_SSL=false`, `MINIO_ACCESS_KEY=audiobooker`, `MINIO_SECRET_KEY=audiobooker-secret-change-me`
- **Gotcha**: Connects via env vars only — no CLI flags supported. Bucket is `audiobooker`.

### docker — Container Management

- **Package**: `mcp-docker-server` v1.0.1
- **Purpose**: List, start, stop, inspect Docker containers; read logs; exec commands
- **When to use**: Debugging container issues, checking if kokoro/minio are healthy, reading service logs
- **Tools**: `list_containers`, `container_logs`, `start_container`, `stop_container`, `restart_container`, `remove_container`, `exec_command`, `container_stats`, `list_images`, `remove_image`
- **Gotcha**: Connects to Docker named pipe on Windows automatically. No config needed.

## Docker MCP Servers (HTTP transport via `docker-compose.yml`)

### playwright — Browser Automation

- **Package**: `@playwright/mcp` v0.0.76 (official Microsoft, 33.9k ⭐)
- **Purpose**: Browser automation — navigate pages, click, type, screenshot, run JS in pages
- **When to use**: Testing frontend UI, debugging visual issues, verifying page behavior, E2E-like checks
- **Key tools**: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_take_screenshot`, `browser_evaluate`, `browser_press_key`, `browser_tabs`
- **Gotcha**: Runs headed by default. Token-heavy — prefer snapshots over screenshots for LLM consumption.

### sequential-thinking — Structured Reasoning

- **Package**: `@modelcontextprotocol/server-sequential-thinking` v2025.12.18
- **Purpose**: Break complex problems into sequential thoughts, revise reasoning, branch alternatives
- **When to use**: Architecture decisions, complex debugging, multi-step refactoring planning
- **Key tool**: `sequentialthinking` — takes `thought`, `thoughtNumber`, `totalThoughts`, `nextThoughtNeeded`
- **Gotcha**: Can increase token usage significantly. Use for complex (>3 step) problems only.

### fetch — Web Content & APIs

- **Package**: `mcp-fetch-server` v1.1.2
- **Purpose**: Fetch web pages as HTML/Markdown/JSON/text, extract readable article content, YouTube transcripts
- **When to use**: Looking up documentation, checking API responses, reading external resources
- **Key tools**: `fetch_html`, `fetch_markdown`, `fetch_txt`, `fetch_json`, `fetch_readable`, `fetch_youtube_transcript`
- **Gotcha**: Has SSRF protection — blocks private/localhost addresses. Use `fetch_readable` for articles (uses Mozilla Readability).

### context7 — Up-to-date Library Docs

- **Package**: `@upstash/context7-mcp` v3.2.1 (1M+ weekly downloads)
- **Purpose**: Fetch version-specific, up-to-date code examples and API docs for any library
- **When to use**: Code generation, setup/config questions, library/API documentation
- **Key tools**: `resolve-library-id` (find library), `get-library-docs` (fetch docs with optional topic)
- **Env var**: `CONTEXT7_API_KEY` (required for higher rate limits)
- **Gotcha**: Always call `resolve-library-id` before `get-library-docs`. Library IDs use `/org/project` format.

## Quick Reference: Which MCP for Which Task

| Task                                       | MCP Server                                    |
| ------------------------------------------ | --------------------------------------------- |
| "Create an epic for feature X"             | → **github** (`issue_write`)                  |
| "Save the research card as a sub-issue"    | → **github** (`issue_write`)                  |
| "Upload a screenshot for the handoff card" | → **github** (`create_or_update_file`)        |
| "Create a PR for my changes"               | → **github** (`create_pull_request`)          |
| "How do I use MUI's Autocomplete?"         | → **mui**                                     |
| "What's in the audiobooker bucket?"        | → **minio**                                   |
| "Are my Docker containers healthy?"        | → **docker**                                  |
| "Take a screenshot of the editor page"     | → **playwright** (then **github** for upload) |
| "Test the frontend login flow"             | → **playwright**                              |
| "Plan the migration from XState v4 to v5"  | → **sequential-thinking**                     |
| "Check the Next.js docs for middleware"    | → **fetch** or **context7**                   |
| "Generate code with Prisma v7 APIs"        | → **context7** (resolve `/prisma/docs`)       |

## Adding a New MCP Server

1. **Local (stdio)**: Add to `.vscode/mcp.json` → `"servers"` block. Use `npx -y <package>` for the command.
2. **Docker (HTTP)**: Add service to `docker-compose.yml` with `--port` and `--transport http` flags, expose port, add to `depends_on` if needed.
3. **Document**: Add entry to this file under the appropriate section.
