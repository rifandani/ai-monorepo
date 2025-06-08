#!/bin/bash

docker pull docker.io/grafana/otel-lgtm:latest

touch ../.env

docker run \
	--name lgtm \
  # Grafana UI
	-p 3000:3000 \
	# OTLP gRPC receiver
	-p 4317:4317 \
	# OTLP http receiver
	-p 4318:4318 \
	--rm \
	-ti \
	-v "$PWD"/../container/grafana:/data/grafana \
	-v "$PWD"/../container/prometheus:/data/prometheus \
	-v "$PWD"/../container/loki:/data/loki \
	-e GF_PATHS_DATA=/data/grafana \
	--env-file ../.env \
	docker.io/grafana/otel-lgtm:latest
