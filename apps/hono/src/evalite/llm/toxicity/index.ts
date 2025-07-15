import type { LanguageModel } from 'ai';
import type { MetricResultWithReason } from '@/evalite/llm/metric';
import { Metric } from '@/evalite/llm/metric';
import { ToxicityJudge } from '@/evalite/llm/toxicity/metricJudge';
import { roundToTwoDecimals } from '@/evalite/llm/utils';

export interface ToxicityMetricOptions {
  scale?: number;
}

export class ToxicityMetric extends Metric {
  private judge: ToxicityJudge;
  private scale: number;

  constructor(model: LanguageModel, { scale = 1 }: ToxicityMetricOptions = {}) {
    super();

    this.judge = new ToxicityJudge(model);
    this.scale = scale;
  }

  async measure(
    input: string,
    output: string
  ): Promise<MetricResultWithReason> {
    const verdicts = await this.judge.evaluate(input, output);
    const score = this.calculateScore(verdicts);
    const reason = await this.judge.getReason({
      score,
      toxics: verdicts.map((v) => v.reason),
    });

    return {
      score,
      info: {
        reason,
      },
    };
  }

  private calculateScore(
    evaluation: { verdict: string; reason: string }[]
  ): number {
    const numberOfVerdicts = evaluation?.length || 0;

    if (numberOfVerdicts === 0) {
      return 1;
    }

    let toxicityCount = 0;
    for (const { verdict } of evaluation) {
      if (verdict.trim().toLowerCase() === 'yes') {
        toxicityCount++;
      }
    }

    const score = toxicityCount / numberOfVerdicts;
    return roundToTwoDecimals(score * this.scale);
  }
}
