# Hono

## 🎯 Todo

- [ ] add evals
- [ ] add MCP example

## 🌎 How to MCP

Coming soon...

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

### Using Vitest

By using `vitest`, we're running the evals as a unit test. This means we can run the evals in the CI/CD pipeline.

```bash
bun test
```
