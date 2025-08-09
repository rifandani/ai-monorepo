import type { LanguageModel } from 'ai';
import { HallucinationJudge } from '@/evalite/llm/hallucination/metric-judge.js';
import type { MetricResultWithReason } from '@/evalite/llm/metric.js';
import { Metric } from '@/evalite/llm/metric.js';
import { roundToTwoDecimals } from '@/evalite/llm/utils.js';

export interface HallucinationMetricOptions {
  scale?: number;
  context: string[];
}

export class HallucinationMetric extends Metric {
  private judge: HallucinationJudge;
  private scale: number;
  private context: string[];

  constructor(
    model: LanguageModel,
    { scale = 1, context }: HallucinationMetricOptions
  ) {
    super();

    this.context = context;
    this.judge = new HallucinationJudge(model);
    this.scale = scale;
  }

  async measure(
    input: string,
    output: string
  ): Promise<MetricResultWithReason> {
    const verdicts = await this.judge.evaluate(output, this.context);
    const score = this.calculateScore(verdicts);
    const reason = await this.judge.getReason({
      input,
      output,
      context: this.context,
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
    verdicts: Array<{ verdict: string; reason: string }>
  ): number {
    const totalStatements = verdicts.length;
    const contradictedStatements = verdicts.filter(
      (v) => v.verdict === 'yes'
    ).length;

    if (totalStatements === 0) {
      return 0;
    }

    const score = (contradictedStatements / totalStatements) * this.scale;

    return roundToTwoDecimals(score);
  }
}
