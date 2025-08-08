import { Metric, type MetricResult } from '@/evalite/llm/metric.js';
import { compareTwoStrings } from '@/evalite/nlp/content-similarity/string-similarity.js';

interface ContentSimilarityResult extends MetricResult {
  info: {
    similarity: number;
  };
}

interface ContentSimilarityOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
}

export class ContentSimilarityMetric extends Metric {
  private options: ContentSimilarityOptions;

  constructor(options: ContentSimilarityOptions = {}) {
    super();
    this.options = {
      ignoreCase: true,
      ignoreWhitespace: true,
      ...options,
    };
  }

  measure(input: string, output: string): ContentSimilarityResult {
    let processedInput = input;
    let processedOutput = output;

    if (this.options.ignoreCase) {
      processedInput = processedInput.toLowerCase();
      processedOutput = processedOutput.toLowerCase();
    }

    if (this.options.ignoreWhitespace) {
      processedInput = processedInput.replace(/\s+/g, ' ').trim();
      processedOutput = processedOutput.replace(/\s+/g, ' ').trim();
    }

    const similarity = compareTwoStrings(processedInput, processedOutput);

    return {
      score: similarity,
      info: { similarity },
    };
  }
}
