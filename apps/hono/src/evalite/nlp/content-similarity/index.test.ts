import { describe, expect, it } from 'vitest';
import { ContentSimilarityMetric } from './index';

describe('ContentSimilarityMetric', () => {
  const metric = new ContentSimilarityMetric();

  it('should return perfect similarity for identical strings', () => {
    const result = metric.measure('The quick brown fox', 'The quick brown fox');
    expect(result.score).toBe(1);
    expect(result.info?.similarity).toBe(1);
  });

  it('should handle case differences with default options', () => {
    const result = metric.measure('The Quick Brown Fox', 'the quick brown fox');
    expect(result.score).toBe(1);
  });

  it('should handle whitespace differences with default options', () => {
    const result = metric.measure(
      'The   quick\nbrown    fox',
      'The quick brown fox'
    );
    expect(result.score).toBe(1);
  });

  it('should be case sensitive when ignoreCase is false', () => {
    const caseSensitiveMetric = new ContentSimilarityMetric({
      ignoreCase: false,
    });
    const result = caseSensitiveMetric.measure(
      'The Quick Brown FOX',
      'the quick brown fox'
    );
    expect(result.score).toBeLessThan(0.8);
  });

  it('should preserve whitespace differences when ignoreWhitespace is true', () => {
    const whitespaceMetric = new ContentSimilarityMetric({
      ignoreCase: true,
      ignoreWhitespace: true,
    });
    const result = whitespaceMetric.measure(
      'The\tquick  brown\n\nfox',
      'The quick brown fox'
    );
    expect(result.score).toBe(1);
  });

  it('should handle both case and whitespace sensitivity', () => {
    const sensitiveMetric = new ContentSimilarityMetric({
      ignoreCase: false,
      ignoreWhitespace: true,
    });
    const result = sensitiveMetric.measure(
      'The\tQuick  Brown\n\nFOX',
      'the quick brown fox'
    );
    expect(result.score).toBeLessThan(0.8);
  });

  it('should handle partial similarity', () => {
    const result = metric.measure(
      'The quick brown fox jumps over the lazy dog',
      'The quick brown fox runs past the lazy dog'
    );
    expect(result.score).toBeGreaterThan(0.7);
    expect(result.score).toBeLessThan(0.8);
  });

  it('should handle completely different strings', () => {
    const result = metric.measure(
      'The quick brown fox',
      'Lorem ipsum dolor sit amet'
    );
    expect(result.score).toBeLessThan(0.3);
  });

  it('should handle empty strings', () => {
    const result = metric.measure('', '');
    expect(result.score).toBe(1);
  });

  it('should handle one empty string', () => {
    const result = metric.measure('The quick brown fox', '');
    expect(result.score).toBe(0);
  });

  it('should include similarity details in result', () => {
    const result = metric.measure('The quick brown fox', 'The quick brown fox');
    expect(result.info).toEqual({ similarity: 1 });
  });
});
