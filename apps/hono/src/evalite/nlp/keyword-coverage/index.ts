import keywordExtractor from 'keyword-extractor';
import { Metric, type MetricResult } from '@/evalite/llm/metric.js';

interface KeywordCoverageResult extends MetricResult {
  info: {
    totalKeywords: number;
    matchedKeywords: number;
  };
}

export class KeywordCoverageMetric extends Metric {
  measure(input: string, output: string): KeywordCoverageResult {
    // Handle empty strings case
    if (!(input || output)) {
      return {
        score: 1,
        info: {
          totalKeywords: 0,
          matchedKeywords: 0,
        },
      };
    }

    const extractKeywords = (text: string) => {
      // @ts-expect-error no types
      return keywordExtractor.extract(text, {
        language: 'english',
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true,
      });
    };

    const referenceKeywords = new Set(extractKeywords(input));
    const responseKeywords = new Set(extractKeywords(output));

    const matchedKeywords = [...referenceKeywords].filter((k) =>
      responseKeywords.has(k)
    );
    const totalKeywords = referenceKeywords.size;
    const coverage =
      totalKeywords > 0 ? matchedKeywords.length / totalKeywords : 0;

    return {
      score: coverage,
      info: {
        totalKeywords: referenceKeywords.size,
        matchedKeywords: matchedKeywords.length,
      },
    };
  }
}
