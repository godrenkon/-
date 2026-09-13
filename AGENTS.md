# AGENTS.md

## Project Context

Suiram RPG Edit is an independent static web application maintained by Suiram Community. Keep changes focused, preserve the editor's JSON compatibility, and do not add a hosted backend or secret to the repository.

## Architecture

- `src/lib/rpgStore.js`: browser-local data store for games, assets, profiles, extensions, and teams.
- `src/`: React frontend and RPG runtime.
- `amplify.yml`: static Amplify build and verification pipeline.
- `.env.local`: local-only configuration; never commit secrets or API keys.

## Working Notes

- Use `npm run dev` for local development.
- Keep the app functional without external authentication or a cloud database.
- AI integrations must remain opt-in and must not contain keys in source code.
- Run the relevant checks from `package.json` before finishing code changes.
