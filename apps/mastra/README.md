# Mastra

## 🎯 Todo

- [ ] zod v4
- [ ] ai sdk v5

## 💾 How to Database

We use `postgres@17` as RDBMS, `pgvector` as vector extension, `drizzle` as ORM, and `node-postgres` as driver.

Config file for drizzle-kit is in `./drizzle.config.ts`. Entry file for drizzle-orm is in `./src/core/db/index.ts`. Migration files are in `./src/core/db/migrations` folder.

Follow below conventions:

- use `snake_case` for table and column names
- for every changes in database schema, create a new migration by running `bun mastra db:gen` and apply it by running `bun mastra db:migrate`
- commit migration files to git

### Database Migrations

You can directly apply changes to your database using the drizzle-kit push command. This is a convenient method for quickly testing new schema designs or modifications in a local development environment, allowing for rapid iterations without the need to manage migration files. This is designed to cover code first approach of Drizzle migrations.

```bash
# directly apply changes to your database
bun mastra db:push
```

Alternatively, you can generate the migrations first, then run the migrations.

```bash
# generate the migrations
bun mastra db:gen

# run the migrations
bun mastra db:migrate
```

We could also pull(introspect) our existing database schema and generate `schema.ts` drizzle schema file from it. This is designed to cover database first approach of Drizzle migrations. This is a great approach if we need to manage database schema outside of our TypeScript project or we're using database, which is managed by somebody else.

```bash
# pull the latest schema from the database
bun mastra db:pull
```

### Database Seeding

Coming soon

### Database Studio

```bash
# run the drizzle studio at https://local.drizzle.studio?port=3003
bun mastra db:studio
```

## 🌎 How to MCP

We have a MCP server that manages a collection of markdown notes, exposing tools to create and read them, and providing intelligent prompts to assist with note-taking.

Run the dev playground, and then navigate to the “MCP Servers” section:

```bash
# running in port 4111
bun mastra dev
```

## 📊 How to Observability

You can check the traces for agents in [Mastra Playground](http://localhost:4111/agents/:agentId/traces) or in the Grafana traces. The traces are saved in the database in `mastra_traces` table inside `mastra` schema.

We are using custom OpenTelemetry logger to send the logs to Loki. You can check the logs in the Grafana logs.

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

Then, start the mastra server to start sending the metrics, traces, and logs to the backend.

```bash
# running in port 4111
bun mastra dev
```

## 🧪 How to Evals

There are 2 ways to run evals:

### Using Dev Playground

Run the dev playground and talk to an agent. The evals will be available after some conversations.

```bash
# running in port 4111
bun mastra dev
```

### Using Vitest

By using `vitest`, we're running the evals as a unit test. This means we can run the evals in the CI/CD pipeline.

```bash
bun test
```
