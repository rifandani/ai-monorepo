# Hono

## 🎯 Todo

- [ ] example of MCP OAUTH
- [ ] add more evals

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

> ERROR: `SqliteError: FOREIGN KEY constraint failed`
> We need to update the `promptfoo` library first.

We use `promptfoo` to evaluate our LLM usage. To run the evals, you can use the following command:

```bash
# use npm to view better logs in terminal
npm run eval
```

To view the evals results, you can use the following command:

```bash
# use npm to view better logs in terminal
npm run eval:view
```

## How to Red Teaming

We use `promptfoo` to run red teaming on our LLM usage. To run the red teaming, you can use the following command:

```bash
# use npm to view better logs in terminal
npm run redteam
```

To view the red teaming results, you can use the following command:

```bash
# use npm to view better logs in terminal
npm run redteam:view
```
