# AI Monorepo

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/rifandani/ai-monorepo)

## 🎯 Todo

- [ ] zod v4
- [ ] ai sdk v5
- [ ] Consider using Bun `catalog` to manage monorepo dependencies (waiting for bun updates, to support updating catalog when running `bun update --latest`)

## 📝 Note

- If there is any `zod` inside `node_modules` folder in the `apps/hono` or `apps/mastra` or `apps/web` folder, you need to remove it to make the autocomplete and typecheck work.

## 📦 Prerequisite

- Node >=24.4.1
- Bun 1.2.19+

## 🛠️ Upgrading Dependencies

- Remember to always use EXACT version for each dependency
- Run `bun bump-deps` to check for outdated dependencies, then run `bun install` to install it
- Run `bun lint-typecheck` for linting and type checking

After making sure all changes are checked, run `bun cs` to create a new changeset and `bun cs:v` to version the changeset.

## 📝 Environment Variables

For first timer, you need to create the 2 environments in your github repo.
First is `dev` environment, and second is `prod` environment (that's why in `.github/workflows/ci.yml` we stated `environment: dev`).
In both environments, name it `HONO_ENV_FILE`, `MASTRA_ENV_FILE`, `WEB_ENV_FILE` (that's why in `.github/workflows/ci.yml` we stated `secrets.HONO_ENV_FILE`,  `secrets.MASTRA_ENV_FILE`, and `secrets.WEB_ENV_FILE`).

The value for `HONO_ENV_FILE` in `dev` environment is `.env.dev`, and the value for `HONO_ENV_FILE` in `prod` environment is `.env.prod` for `@workspace/hono`.
The value for `MASTRA_ENV_FILE` in `dev` environment is `.env.dev`, and the value for `MASTRA_ENV_FILE` in `prod` environment is `.env.prod` for `@workspace/mastra`.
The value for `WEB_ENV_FILE` in `dev` environment is `.env.dev`, and the value for `WEB_ENV_FILE` in `prod` environment is `.env.prod` for `@workspace/web`.

Everytime there is a change in the local env variables, you need to also update the env variables in the github repo.

<!-- For first timer, you need to create 2 environments in your github repo.
Go to your Github repo -> `Settings` tabs -> `Environments` -> `New environment` -> `dev` and `prod` (that's why in `.github/workflows/ci.yml` we stated `environment: dev` and `environment: prod`).

To push our local env variables to the github repo, run:

```bash
# that's why in `.github/workflows/ci.yml` we stated `secrets.HONO_ENV_FILE` and `secrets.MASTRA_ENV_FILE`
gh secret set HONO_ENV_FILE -e dev -f ./apps/spa/.env.dev
gh secret set HONO_ENV_FILE -e prod -f ./apps/spa/.env.prod
gh secret set MASTRA_ENV_FILE -e dev -f ./apps/web/.env.dev
gh secret set MASTRA_ENV_FILE -e prod -f ./apps/web/.env.prod
gh secret set WEB_ENV_FILE -e dev -f ./apps/web/.env.dev
gh secret set WEB_ENV_FILE -e prod -f ./apps/web/.env.prod
```

Everytime there is a change in the local env variables, you need to also push those changes to the github repo by running the command above. -->

## 📱 Apps

### @workspace/hono

[See here](./apps/hono/README.md)

### @workspace/mastra

[See here](./apps/mastra/README.md)

### @workspace/web

[See here](./apps/web/README.md)

## 📦 Packages

### @workspace/core

[See here](./packages/core/README.md)

### @workspace/typescript-config

[See here](./packages/typescript-config/README.md)
