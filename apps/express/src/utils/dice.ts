import { Logger } from '@/utils/logger';
import { metrics, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('dice-lib', '1.0.0');
const meter = metrics.getMeter('dice-lib', '1.0.0');
const counter = meter.createCounter('dice-lib.rolls.counter');
const logger = new Logger('dice-lib');

function rollOnce(i: number, min: number, max: number) {
  return tracer.startActiveSpan(`rollOnce:${i}`, (span) => {
    counter.add(1);
    logger.log(`Rolling a single die between ${min} and ${max}`);

    const result = Math.floor(Math.random() * (max - min + 1) + min);

    // Add an attribute to the span
    span.setAttribute('dicelib.rolled', result.toString());

    span.end();
    return result;
  });
}

export function rollTheDice(rolls: number, min: number, max: number) {
  // Create a span. A span must be closed.
  return tracer.startActiveSpan(
    'rollTheDice',
    { attributes: { 'dicelib.rolls': rolls.toString() } },
    (parentSpan) => {
      logger.log(`Rolling ${rolls} dice(s) between ${min} and ${max}`);
      const result: number[] = [];

      for (let i = 0; i < rolls; i++) {
        result.push(rollOnce(i, min, max));
      }

      // Be sure to end the span!
      parentSpan.end();
      return result;
    }
  );
}
