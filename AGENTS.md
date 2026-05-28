# AGENTS.md

This project follows the GrowLead multi-CLI convention. All AI agents
(Claude Code, Codex CLI, Gemini CLI, Cursor) should read [`CLAUDE.md`](./CLAUDE.md)
as the canonical source of truth for stack, commands, conventions, anti-patterns,
and HARD RULES.

## Tool-specific entry points

| Tool | File |
|------|------|
| Claude Code | [`CLAUDE.md`](./CLAUDE.md) |
| Codex CLI | [`.codex/config.toml`](./.codex/config.toml) + `CLAUDE.md` |
| Gemini CLI | [`GEMINI.md`](./GEMINI.md) (thin pointer to this file) |
| Cursor | `.cursorrules` (auto-generated from `CLAUDE.md` if needed) |

## Quick task pointer

- "Where do I start?" → [CLAUDE.md "Forking workflow"](./CLAUDE.md#forking-workflow)
- Stack & commands → [CLAUDE.md "Stack"](./CLAUDE.md#stack-lock--do-not-deviate-without-adr)
- Anti-patterns → [CLAUDE.md "Anti-patterns"](./CLAUDE.md#anti-patterns-do-not-do)
- Skill routing → [CLAUDE.md "When to use which skill"](./CLAUDE.md#when-to-use-which-skill)

<!-- Origin: expo-supabase-template — multi-CLI handbook | 2026-05-28 -->
