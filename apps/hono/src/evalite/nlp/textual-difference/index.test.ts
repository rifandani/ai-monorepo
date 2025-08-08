import { describe, expect, it } from 'vitest';
import { TextualDifferenceMetric } from './index.js';

describe('TextualDifferenceMetric', () => {
  const metric = new TextualDifferenceMetric();

  it('should return perfect match for identical strings', () => {
    const result = metric.measure('The quick brown fox', 'The quick brown fox');
    expect(result.score).toBe(1);
    expect(result.info).toEqual({
      confidence: 1,
      ratio: 1,
      changes: 0,
      lengthDiff: 0,
    });
  });

  it('should handle small differences', () => {
    const result = metric.measure('The quick brown fox', 'The quick brown cat');
    expect(result.score).toBeGreaterThan(0.8);
    expect(result.info?.changes).toBe(1);
  });

  it('should handle word additions', () => {
    const result = metric.measure(
      'The quick brown fox',
      'The very quick brown fox'
    );
    expect(result.score).toBeGreaterThan(0.7);
    expect(result.info?.changes).toBe(1);
  });

  it('should handle word deletions', () => {
    const result = metric.measure(
      'The quick brown fox jumps',
      'The quick fox jumps'
    );
    expect(result.score).toBeGreaterThan(0.7);
    expect(result.info?.changes).toBe(1);
  });

  it('should handle multiple changes', () => {
    const result = metric.measure(
      'The quick brown fox jumps over the lazy dog',
      'The slow black fox runs under the active cat'
    );
    expect(result.score).toBeGreaterThan(0.4);
    expect(result.score).toBeLessThan(0.7);
    expect(result.info?.changes).toBeGreaterThan(3);
  });

  it('should handle completely different strings', () => {
    const result = metric.measure(
      'The quick brown fox',
      'Lorem ipsum dolor sit amet'
    );
    expect(result.score).toBeLessThan(0.3);
    expect(result.info?.changes).toBeGreaterThan(3);
  });

  it('should handle empty strings', () => {
    const result = metric.measure('', '');
    expect(result.score).toBe(1);
    expect(result.info?.changes).toBe(0);
    expect(result.info?.lengthDiff).toBe(0);
  });

  it('should handle one empty string', () => {
    const result = metric.measure('The quick brown fox', '');
    expect(result.score).toBe(0);
    expect(result.info?.changes).toBeGreaterThan(0);
    expect(result.info?.lengthDiff).toBe(1);
  });

  it('should handle case sensitivity', () => {
    const result = metric.measure('The Quick Brown Fox', 'the quick brown fox');
    expect(result.score).toBeLessThan(1);
    expect(result.info?.changes).toBeGreaterThan(0);
  });

  it('should handle whitespace sensitivity', () => {
    const result = metric.measure(
      'The   quick\nbrown    fox',
      'The quick brown fox'
    );
    expect(result.score).toBeLessThan(1);
    expect(result.info?.changes).toBeGreaterThan(0);
  });

  it('should include difference details in result', () => {
    const result = metric.measure('The quick brown fox', 'The quick brown fox');
    expect(result.info).toEqual({
      confidence: 1,
      ratio: 1,
      changes: 0,
      lengthDiff: 0,
    });
  });
});
