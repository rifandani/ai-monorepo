# Web

## 🐛 Fix

- [ ] performance issue in mermaid rendering
- [ ] performance issue in chat field input
- [ ] formatting styles in markdown sometimes not rendered correctly in ordered list
- [ ] sometimes response text includes ````markdown```` block, we need to parse it as regular markdown instead of code block. Or adjust system prompt to avoid this

## 🎯 Todo

- [ ] use Elements UI and `streamdown` (fix performance issue in mermaid rendering, chat field input)
- [ ] change `SERVICE_NAME` and `SERVICE_VERSION` to `ENV.APP_TITLE` and `ENV.APP_VERSION`
- [ ] follow up with `fe-monorepo` latest version (when we upgrade `react-aria`, we also need to update intentui)
- [ ] implement share in chat history
- [ ] implement rename in chat history
- [ ] implement archive in chat history
- [ ] Add a document/artifact/canvas mode for content creation, artifact type: text (markdown), code editor, spreadsheet, image, etc

## 📝 Notes

- chat history saved in `.chats` folder as JSON file
- "human in the loop" are only supported in `models.flash20`

## 🚧 How to Debug

- add breakpoint anywhere in the code
- use vscode `launch.json` "Next.js: debug full stack with Chrome" to debug the full stack app

## 📊 Observability

You can check the traces, metrics, and logs in the Grafana dashboard.
Use logger from `@workspace/core/utils/logger` to normally console.log that works in browser and server.
Use logger from `@/core/utils/logger` to log telemetry data that works in server ONLY.
Do not log using `diag` from `@opentelemetry/api` because we only use it for internal otel logs.
Instrumented for server-side only.

### Grafana

Run docker compose to start the [`grafana/otel-lgtm`](https://github.dev/grafana/docker-otel-lgtm/) container. This will spin up a OpenTelemetry backend including [Prometheus](https://grafana.com/docs/grafana/latest/datasources/prometheus/) (metrics database), [Tempo](https://grafana.com/docs/grafana/latest/datasources/tempo/) (traces database), [Loki](https://grafana.com/docs/grafana/latest/datasources/loki/) (logs database), and [Pyroscope](https://grafana.com/docs/grafana/latest/datasources/pyroscope/) (profiling database). It also spin up Grafana Dashboard for visualization at `http://localhost:3111`. If you haven't logged in, use the following credentials:

- Username: `admin`
- Password: `admin`
