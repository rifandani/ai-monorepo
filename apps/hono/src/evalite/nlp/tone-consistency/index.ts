import Sentiment from 'sentiment';
import { Metric, type MetricResult } from '@/evalite/llm/metric';

interface ToneConsitencyResult extends MetricResult {
  info:
    | {
        responseSentiment: number;
        referenceSentiment: number;
        difference: number;
      }
    | {
        avgSentiment: number;
        sentimentVariance: number;
      };
}

export class ToneConsistencyMetric extends Metric {
  private sentiment = new Sentiment();

  measure(input: string, output: string): ToneConsitencyResult {
    const responseSentiment = this.sentiment.analyze(input);

    if (output) {
      // Compare sentiment with reference
      const referenceSentiment = this.sentiment.analyze(output);
      const sentimentDiff = Math.abs(
        responseSentiment.comparative - referenceSentiment.comparative
      );
      const normalizedScore = Math.max(0, 1 - sentimentDiff);

      return {
        score: normalizedScore,
        info: {
          responseSentiment: responseSentiment.comparative,
          referenceSentiment: referenceSentiment.comparative,
          difference: sentimentDiff,
        },
      };
    }

    // Evaluate sentiment stability across response
    const sentences = input.match(/[^.!?]+[.!?]+/g) || [input];
    const sentiments = sentences.map(
      (s) => this.sentiment.analyze(s).comparative
    );
    const avgSentiment =
      sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    const variance =
      sentiments.reduce((sum, s) => sum + (s - avgSentiment) ** 2, 0) /
      sentiments.length;
    const stability = Math.max(0, 1 - variance);

    return {
      score: stability,
      info: {
        avgSentiment,
        sentimentVariance: variance,
      },
    };
  }
}
