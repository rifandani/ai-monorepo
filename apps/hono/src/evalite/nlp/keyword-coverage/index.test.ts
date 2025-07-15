import { describe, expect, it } from 'vitest';
import { KeywordCoverageMetric } from './index';

describe('KeywordCoverageMetric', () => {
  const metric = new KeywordCoverageMetric();

  it('should return perfect coverage for identical text', () => {
    const result = metric.measure(
      'The quick brown fox jumps over the lazy dog',
      'The quick brown fox jumps over the lazy dog'
    );
    expect(result.score).toBe(1);
    expect(result.info?.matchedKeywords).toBe(6);
    expect(result.info?.totalKeywords).toBe(6);
  });

  it('should handle partial keyword coverage', () => {
    const result = metric.measure(
      'The quick brown fox jumps over the lazy dog',
      'A quick brown fox runs past a sleeping cat'
    );
    expect(result.score).toBeGreaterThan(0.3);
    expect(result.score).toBeLessThan(0.7);
    const matched = result.info?.matchedKeywords as number;
    const total = result.info?.totalKeywords as number;
    expect(matched).toBeLessThan(total);
  });

  it('should ignore common words and stop words', () => {
    const result = metric.measure('The quick brown fox', 'A quick brown fox');
    expect(result.score).toBe(1); // "the" and "a" should be ignored
    const matched = result.info?.matchedKeywords as number;
    const total = result.info?.totalKeywords as number;
    expect(matched).toBe(total);
  });

  it('should handle case differences', () => {
    const result = metric.measure('The Quick Brown Fox', 'the quick brown fox');
    expect(result.score).toBe(1);
    const matched = result.info?.matchedKeywords as number;
    const total = result.info?.totalKeywords as number;
    expect(matched).toBe(total);
  });

  it('should handle empty strings', () => {
    const result = metric.measure('', '');
    expect(result.score).toBe(1);
    expect(result.info?.totalKeywords).toBe(0);
    expect(result.info?.matchedKeywords).toBe(0);
  });

  it('should handle one empty string', () => {
    const result = metric.measure('The quick brown fox', '');
    expect(result.score).toBe(0);
    expect(result.info?.matchedKeywords).toBe(0);
    expect(result.info?.totalKeywords).toBeGreaterThan(0);
  });

  it('should ignore numbers by default', () => {
    const result = metric.measure(
      'The 123 quick 456 brown fox',
      'The quick brown fox'
    );
    expect(result.score).toBe(1);
  });

  it('should handle special characters', () => {
    const result = metric.measure(
      'The quick-brown fox!',
      'The quick brown fox'
    );
    // Hyphenated words are treated as separate keywords
    expect(result.score).toBeGreaterThanOrEqual(0.5);
    expect(result.score).toBeLessThan(1);
  });

  it('should handle completely different content', () => {
    const result = metric.measure(
      'The quick brown fox jumps over the lazy dog',
      'Lorem ipsum dolor sit amet'
    );
    expect(result.score).toBe(0);
    expect(result.info?.matchedKeywords).toBe(0);
  });

  it('should include coverage details in result', () => {
    const result = metric.measure('quick brown fox', 'quick brown fox');
    expect(result.info).toEqual({
      totalKeywords: 3,
      matchedKeywords: 3,
    });
  });
});
