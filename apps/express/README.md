# @workspace/express

## 💻 Development

Run docker compose to start the [`grafana/otel-lgtm`](https://github.dev/grafana/docker-otel-lgtm/) container. This will spin up a OpenTelemetry backend including Prometheus (metrics database), Tempo (traces database), Loki (logs database), and Pyroscope (profiling database). It also spin up Grafana for visualization.

```bash
# cd into root of the workspace
cd ../..

# run the docker compose file
bun compose:up
```

Then, start the express server.

```bash
# running in port 8084
bun dev
```

Try to make a request to the express server to trigger the OpenTelemetry instrumentation.

```bash
curl http://localhost:8084/rolldice?rolls=10

# try to trigger a 400 error
curl http://localhost:8084/rolldice?rolls=abc

# try to trigger a 404 error
curl -X POST http://localhost:8084/rolldice
```

## 📊 Grafana

Open the Grafana UI at `http://localhost:3111`. If you haven't logged in, use the following credentials:

- Username: `admin`
- Password: `admin`
