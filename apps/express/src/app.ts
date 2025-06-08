import { PORT } from '@/utils/constants';
import { rollTheDice } from '@/utils/dice';
import { Logger } from '@/utils/logger';
import { SpanStatusCode, ValueType, metrics, trace } from '@opentelemetry/api';
import express from 'express';

const tracer = trace.getTracer('dice-server', '1.0.0');
const meter = metrics.getMeter('dice-server', '1.0.0');
const logger = new Logger('dice-server');
const app = express();

app.get('/rolldice', (req, res) => {
  const histogram = meter.createHistogram('http.server.duration', {
    description: 'The distribution of the HTTP server response time',
    unit: 'milliseconds',
    valueType: ValueType.INT,
  });
  const startTime = Date.now();

  return tracer.startActiveSpan('rollDice', (span) => {
    logger.log('Received request to roll dice');

    const rolls = req.query.rolls
      ? Number.parseInt(req.query.rolls.toString())
      : Number.NaN;

    if (Number.isNaN(rolls)) {
      const errorMessage =
        "Request parameter 'rolls' is missing or not a number.";

      logger.error(errorMessage);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: errorMessage,
      });
      span.end();
      res.status(400).send(errorMessage);
      return;
    }

    const result = JSON.stringify(rollTheDice(rolls, 1, 6));
    const endTime = Date.now();
    const duration = endTime - startTime;

    logger.log(`Rolled ${rolls} dice with result: ${result}`);
    histogram.record(duration);
    span.setStatus({
      code: SpanStatusCode.OK,
    });
    span.end();
    res.send(result);
  });
});

app.listen(PORT, () => {
  console.log(`Listening for requests on http://127.0.0.1:${PORT}`);
});
