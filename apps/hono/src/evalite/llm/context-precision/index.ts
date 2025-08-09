import type { LanguageModel } from 'ai';
import { ContextPrecisionJudge } from '@/evalite/llm/context-precision/metric-judge.js';
import type { MetricResultWithReason } from '@/evalite/llm/metric.js';
import { Metric } from '@/evalite/llm/metric.js';
import { roundToTwoDecimals } from '@/evalite/llm/utils.js';

export interface ContextPrecisionMetricOptions {
  scale?: number;
  context: string[];
}

export class ContextPrecisionMetric extends Metric {
  private judge: ContextPrecisionJudge;
  private scale: number;
  private context: string[];

  constructor(
    model: LanguageModel,
    { scale = 1, context }: ContextPrecisionMetricOptions
  ) {
    super();

    this.context = context;
    this.judge = new ContextPrecisionJudge(model);
    this.scale = scale;
  }

  async measure(
    input: string,
    output: string
  ): Promise<MetricResultWithReason> {
    const verdicts = await this.judge.evaluate(input, output, this.context);
    const score = this.calculateScore(verdicts);
    const reason = await this.judge.getReason({
      input,
      output,
      score,
      scale: this.scale,
      verdicts,
    });

    return {
      score,
      info: {
        reason,
      },
    };
  }

  private calculateScore(
    verdicts: { verdict: string; reason: string }[]
  ): number {
    const totalVerdicts = verdicts?.length || 0;
    if (totalVerdicts === 0) {
      return 0;
    }

    // Convert to binary scores (1 for yes, 0 for no)
    const binaryScores = verdicts.map((v) =>
      v.verdict.trim().toLowerCase() === 'yes' ? 1 : 0
    );

    let weightedPrecisionSum = 0;
    let relevantCount = 0;

    // Calculate weighted precision at each position
    binaryScores.forEach((isRelevant, index) => {
      if (isRelevant) {
        relevantCount++;
        const currentPrecision = relevantCount / (index + 1);
        weightedPrecisionSum += currentPrecision * isRelevant;
      }
    });

    if (relevantCount === 0) {
      return 0;
    }

    const finalScore = weightedPrecisionSum / relevantCount;
    return roundToTwoDecimals(finalScore * this.scale);
  }
}
