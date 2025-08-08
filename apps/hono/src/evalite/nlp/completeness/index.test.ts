import { beforeEach, describe, expect, it } from 'vitest';
import { CompletenessMetric } from './index.js';

describe('CompletenessMetric', () => {
  let metric: CompletenessMetric;

  beforeEach(() => {
    metric = new CompletenessMetric();
  });

  describe('basic functionality', () => {
    it('should return high score for identical text', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const result = metric.measure(text, text);

      expect(result.score).toBeCloseTo(1.0);
      expect(result.info?.elementCounts).toBeDefined();
    });

    it('should return lower score for simplified text missing elements', () => {
      const original = 'The quick brown fox jumps over the lazy dog';
      const simplified = 'The fox jumps over the dog';
      const result = metric.measure(original, simplified);

      expect(result.score).toBeLessThan(1.0);
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.info?.missingElements).toContain('brown');
      expect(result.info?.missingElements).toContain('lazy');
    });

    it('should handle completely different texts', () => {
      const original = 'The weather is sunny today';
      const simplified = 'I like to eat pizza';
      const result = metric.measure(original, simplified);

      expect(result.score).toBeLessThan(0.3);
      const { input, output } = result.info?.elementCounts as {
        input: number;
        output: number;
      };
      expect(input).toBeGreaterThan(0);
      expect(output).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle both empty strings', () => {
      const result = metric.measure('', '');
      expect(result.score).toBe(1);
      const { input, output } = result.info?.elementCounts as {
        input: number;
        output: number;
      };
      expect(input).toBe(0);
      expect(output).toBe(0);
    });

    it('should handle empty original string', () => {
      const result = metric.measure('', 'some text');
      expect(result.score).toBe(0);
    });

    it('should handle whitespace-only strings', () => {
      const result = metric.measure('   \n  ', '  \n  ');
      expect(result.score).toBe(1);
      const { input, output } = result.info?.elementCounts as {
        input: number;
        output: number;
      };
      expect(input).toBe(0);
      expect(output).toBe(0);
    });

    it('should handle null and undefined inputs', () => {
      // @ts-expect-error Testing invalid input
      expect(metric.measure(null, '')).rejects.toThrow();
      // @ts-expect-error Testing invalid input
      expect(metric.measure('', undefined)).rejects.toThrow();
    });
  });

  describe('special cases', () => {
    it('should handle lists and enumerations', () => {
      const result = metric.measure(
        'apples, oranges, and bananas',
        'apples and bananas'
      );
      expect(result.score).toBeLessThan(0.8);
      expect(result.info?.missingElements).toContain('oranges');
    });

    it('should handle repeated elements', () => {
      const result = metric.measure('cat cat cat cats', 'cat cats');
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('should handle long and multi-paragraph text', () => {
      const original = `First paragraph about AI.
        Second paragraph about ML.
        Third paragraph about DL.`;
      const simplified = `First para about AI.
        Second para about ML.`;
      const result = metric.measure(original, simplified);

      expect(result.score).toBeGreaterThan(0.5);
      expect(result.info?.missingElements).toBeDefined();
    });
  });
});
