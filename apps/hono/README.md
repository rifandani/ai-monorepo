# Hono

## 🎯 Todo

- [ ] zod v4
- [ ] ai sdk v5
- [ ] replace `SERVICE_NAME` into `ENV.APP_TITLE`
- [ ] do not use all `@opentelemetry/auto-instrumentations-node`, it will reduce performance up to 80%. Use selectively like `@opentelemetry/instrumentation-dns`, `@opentelemetry/instrumentation-http`, `@opentelemetry/instrumentation-net`, `@opentelemetry/instrumentation-pg`, `@opentelemetry/instrumentation-runtime-node`, `@opentelemetry/instrumentation-undici`.
- [ ] example of MCP OAUTH
- [ ] example of [Memories](https://ai-sdk.dev/providers/community-providers/mem0)
- [ ] replace all `import { z } from 'zod'` or `import { z as z3 } from 'zod/v3'` occurences with `import { z } from 'zod/v4'` in the codebase. currently `@hono/zod-openapi@beta` works with zod 4, still waiting for [this issue](https://github.com/honojs/middleware/issues/1177) to be resolved.

## 💾 How to Database

We use `postgres@17` as RDBMS, `pgvector` as vector extension, `drizzle` as ORM, and `node-postgres` as driver.

Config file for drizzle-kit is in `./drizzle.config.ts`. Entry file for drizzle-orm is in `./src/core/db/index.ts`. Migration files are in `./src/core/db/migrations` folder.

Follow below conventions:

- use `snake_case` for table and column names
- for every changes in database schema, create a new migration by running `bun hono db:gen` and apply it by running `bun hono db:migrate`
- commit migration files to git

### Database Migrations

You can directly apply changes to your database using the drizzle-kit push command. This is a convenient method for quickly testing new schema designs or modifications in a local development environment, allowing for rapid iterations without the need to manage migration files. This is designed to cover code first approach of Drizzle migrations.

```bash
# directly apply changes to your database
bun hono db:push
```

Alternatively, you can generate the migrations first, then run the migrations.

```bash
# generate the migrations
bun hono db:gen

# run the migrations
bun hono db:migrate
```

We could also pull(introspect) our existing database schema and generate `schema.ts` drizzle schema file from it. This is designed to cover database first approach of Drizzle migrations. This is a great approach if we need to manage database schema outside of our TypeScript project or we're using database, which is managed by somebody else.

```bash
# pull the latest schema from the database
bun hono db:pull
```

### Database Seeding

```bash
# reset and seed the images table
bun hono db:seed-images
```

### Database Studio

```bash
# run the drizzle studio at https://local.drizzle.studio?port=3003
bun hono db:studio
```

## 🔒 How to Auth

We use `better-auth` for authentication.

```bash
# everytime we add/remove/change auth schema, generate the new auth schema
bun hono auth:gen

# generate drizzle migrations
bun hono db:gen

# run drizzle migrations
bun hono db:migrate
```

## 🌎 How to MCP

We have a simple example of a MCP server and client in the `./src/mcp` directory.
The `markitdown` folder contains a server in python (cloned from [github](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp), we need to follow their instructions to setup the mcp server) and a client in typescript.
The `stdio` folder contains a simple example of a get pokemon MCP server and client using the `stdio` transport.

1. Using the `markitdown`

First, start the docker service (orbstack or docker desktop), then build the `markitdown` docker image:

```bash
# cd into /apps/hono/src/mcp/markitdown
cd apps/hono/src/mcp/markitdown

# for first timer, build the markitdown docker image
docker build -t markitdown-mcp:latest .
```

Then, run the MCP client script

```bash
# might take a while to get final answer
bun mcp:markitdown:client
```

2. Using the `stdio`

There are two ways to run the MCP server, based on your choice, the `client.ts` also need to be adjusted.

First, by directly running the server as typescript using `tsx` (recommended).

```bash
# directly run the server
bun mcp:stdio:server
```

Second, by compiling it down to javascript and run the javascript file.

```bash
# compile the server to javascript first
bun mcp:stdio:server:js:build

# run the javascript file
bun mcp:stdio:server:js:run
```

After running the server, you can run the client to test it.

```bash
bun mcp:stdio:client
```

3. Using the `Streamable HTTP`

This can be found in the `./src/routes/mcp.ts` file.

```bash
# start the hono dev server
bun dev
```

To run the client directly from HTTP request, you can go to `http://localhost:3333/mcp-client` and test it.

4. Using the `Streamable HTTP` example from the `@modelcontextprotocol/sdk` node_modules

To start the streamable http mcp server.

```bash
# start the streamable http mcp server
bun mcp:stream:example:server
```

And then, start the client.

```bash
# cd into /apps/hono
cd apps/hono

# start the streamable http mcp client using regular node & npm (using bun throws errors `TypeError: process.stdin.setRawMode is not a function`)
npm run mcp:stream:example:client
```

> when running `bun mcp:stream:example:server` with `--oauth` and found error `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'src' imported from /Users/rizeki.rifandani/Desktop/dev/projects/ai/node_modules/@modelcontextprotocol/sdk/dist/esm/examples/server/demoInMemoryOAuthProvider.js`, you should change the `demoInMemoryOAuthProvider.js` file in the `node_modules` from `import { createOAuthMetadata, mcpAuthRouter } from 'src/server/auth/router.js';` to `import { createOAuthMetadata, mcpAuthRouter } from '../../server/auth/router.js';`. After that it still doesn't work when we try to connect through the inspector.

5. Using the MCP inspector

Run the inspector for testing and debugging MCP servers. The inspector is a MCP host and client that allows us to test and debug various MCP servers.

```bash
bun mcp:inspector
```

This will start the inspector server on `http://127.0.0.1:6274/`.

- Testing the `markitdown` example. In "Transport Type" choose `STDIO`, in "command" enter `docker`, in "args" enter `run --rm -i markitdown-mcp:latest`.

- Testing the `stdio` example. In "Transport Type" choose `STDIO`, in "command" enter `npm`, in "args" enter `run mcp:stdio:server`. You can also use "command" `bun`, in "args" enter `run $PWD`.

- Testing the `Streamable HTTP` example. Start the hono dev server first. Then, in "Transport Type" choose `Streamable HTTP`, in "URL" enter `http://localhost:3333/mcp`.

- Testing the `Streamable HTTP` example from the `@modelcontextprotocol/sdk` node_modules. In "Transport Type" choose `Streamable HTTP`, in "URL" enter `http://localhost:3000/mcp` (it's using express). The OAuth Server is running on `http://localhost:3001`.

### Updating `markitdown` in `@workspaces/hono/src/mcp/markitdown`

```bash
# cd into /apps/hono/src/mcp/markitdown
cd apps/hono/src/mcp/markitdown

# re-clone the markitdown mcp repo
bunx degit microsoft/markitdown/packages/markitdown-mcp --force
```

## 📊 How to Observability

Since we are using OpenTelemetry, it will emit standard OTLP HTTP (standard OpenTelemetry protocol), you can use any OpenTelemetry Collector, which gives you the flexibility to connect it to any backend that you want. Just change the `baseUrl` in the `./src/instrumentation.ts` file.

Use `span.setAttributes` and `span.addEvent` most of the time, use `logger` only in places where you don't care about measuring the timing (e.g. global app error handler), or when you want to emphasize and save some important information / state changes.

> when we pass in `experimental_telemetry.functionId` to the `ai` SDK, it's not used as the span name, but rather it will be set as span attributes `resource.name`.

### Grafana

Run docker compose to start the [`grafana/otel-lgtm`](https://github.dev/grafana/docker-otel-lgtm/) container. This will spin up a OpenTelemetry backend including [Prometheus](https://grafana.com/docs/grafana/latest/datasources/prometheus/) (metrics database), [Tempo](https://grafana.com/docs/grafana/latest/datasources/tempo/) (traces database), [Loki](https://grafana.com/docs/grafana/latest/datasources/loki/) (logs database), and [Pyroscope](https://grafana.com/docs/grafana/latest/datasources/pyroscope/) (profiling database). It also spin up Grafana Dashboard for visualization at `http://localhost:3111`. If you haven't logged in, use the following credentials:

- Username: `admin`
- Password: `admin`

```bash
# cd into root of the workspace
cd ../..

# run the docker compose file
bun compose:up
```

Then, start the hono server to start sending the metrics, traces, and logs to the backend.

```bash
# running in port 3333
bun hono dev
```

## 🧪 How to Evals

We use `promptfoo` to evaluate our prompts.

```bash
# run multiple evals
bun eval hono getting-started

# view the evals results
bun eval:view
```

> Creating multiple eval file in the `./evals/configs` and run it with `promptfoo eval --config evals/configs/*` doesn't work as expected, it will merge all the .yaml configs, instead of treating them as separate configs.

We also use `evalite` to evaluate our functions, which act and considered as a unit test for our AI app.
`evalite` runs on top of `vitest`, so to create a new eval, create a new file with the name `*.eval.ts`.

```bash
# run the evals, see the results in the terminal, and open the results as UI at http://localhost:3006/
bun evalite
```

## 🕵🏻‍♂️ How to Red Teaming

We use `promptfoo` to run red teaming (end-to-end pen-testing by hitting the API endpoints) on our LLM usage.

```bash
# run the red teaming
bun redteam deep-research
```

To view the red teaming results, you can use the following command:

```bash
bun redteam:view
```
