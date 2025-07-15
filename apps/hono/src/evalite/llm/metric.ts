export interface MetricResult {
  score: number;
  // biome-ignore lint/suspicious/noExplicitAny: xxx
  info?: Record<string, any>;
}

export interface MetricResultWithReason extends MetricResult {
  info: {
    reason: string;
  };
}

export abstract class Metric {
  abstract measure(
    input: string,
    output: string
  ): Promise<MetricResult> | MetricResult;
}
