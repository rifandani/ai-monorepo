import { SequenceMatcher } from 'difflib';
import { Metric, type MetricResult } from '@/evalite/llm/metric';

interface TextualDifferenceResult extends MetricResult {
  info: {
    ratio: number;
    changes: number;
    lengthDiff: number;
    confidence: number;
  };
}

export class TextualDifferenceMetric extends Metric {
  measure(input: string, output: string): TextualDifferenceResult {
    const matcher = new SequenceMatcher(null, input, output);
    const ratio = matcher.ratio();

    // Get detailed operations
    const ops = matcher.getOpcodes();
    const changes = ops.filter(([op]) => op !== 'equal').length;

    // Calculate confidence based on text length difference
    const maxLength = Math.max(input.length, output.length);
    const lengthDiff =
      maxLength > 0 ? Math.abs(input.length - output.length) / maxLength : 0;
    const confidence = 1 - lengthDiff;

    return {
      score: ratio,
      info: {
        confidence,
        ratio,
        changes,
        lengthDiff,
      },
    };
  }
}
