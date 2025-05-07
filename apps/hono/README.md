# Hono

## todo

- [ ] example of using llama-index
- [ ] example of using langchain
- [ ] integrate LLM observabilty and evals (e.g promptfoo, phoenix, langfuse, helicone)

## How to MCP

We have a simple example of a MCP server and client in the `./src/mcp` directory. The `markitdown` folder contains a server in python (cloned from [github](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp), we need to follow their instructions to setup the mcp server) and a client in typescript. The `stdio` folder contains a simple example of a get pokemon MCP server and client using the `stdio` transport.

1. Using the `markitdown`

First, start the docker service (orbstack or docker desktop), then run the MCP client script

```bash
# might take a while to get final answer
bun mcp:markitdown:client
```

2. Using the `stdio`

There are two ways to run the MCP server, based on your choice, the `client.ts` also need to be adjusted. First, by directly running the server as typescript using `tsx` (recommended).

```bash
# directly run the server as typescript
bun mcp:stdio:server
```

Second, by compiling it down to javascript and run the javascript file.

```bash
# compile the server to javascript first
bun mcp:stdio:server:js:build

# run the javascript file
bun mcp:stdio:server:js:run
```

3. Using the `Streamable HTTP`

This can be found in the `./src/routes/mcp.ts` file.

```bash
# start the hono dev server
bun dev
```

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

5. Using the MCP inspector

Run the inspector for testing and debugging MCP servers. The inspector is a MCP host and client that allows us to test and debug various MCP servers.

```bash
bun mcp:inspector
```

This will start the inspector server on `http://127.0.0.1:6274/`.

- Testing the `markitdown` example. In "Transport Type" choose `STDIO`, in "command" enter `docker`, in "args" enter `run --rm -i markitdown-mcp:latest`.

- Testing the `stdio` example. In "Transport Type" choose `STDIO`, in "command" enter `npm`, in "args" enter `run mcp:stdio:server`.

- Testing the `Streamable HTTP` example. Start the hono dev server first. Then, in "Transport Type" choose `Streamable HTTP`, in "URL" enter `http://localhost:3333/mcp`.

- Testing the `Streamable HTTP` example from the `@modelcontextprotocol/sdk` node_modules. In "Transport Type" choose `Streamable HTTP`, in "URL" enter `http://localhost:3000/mcp` (it's using express).

## How to Evals and Red Teaming with `promptfoo`

We use `promptfoo` to eval and red teaming our LLM usage. To run the evals, you can use the following command:

```bash
# use npm to view better logs in terminal
npm run eval

# or, if you run it from the root
npm run eval -w @workspaces/hono
```

To view the evals results, you can use the following command:

```bash
# use npm to view better logs in terminal
npm run eval:view

# or, if you run it from the root
npm run eval:view -w @workspaces/hono
```
