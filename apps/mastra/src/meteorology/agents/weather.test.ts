import { evaluate } from '@mastra/evals';
import { describe, expect, it } from 'vitest';
import { weatherAgent } from './weather';

describe('Weather Agent Evaluations', () => {
  it('should evaluates how well an LLMs output answers or addresses the input query', async () => {
    const result = await evaluate(
      weatherAgent,
      'what is the weather like in Balikpapan?',
      weatherAgent.evals.answerRelevancy
    );

    /**
     * 1.0: Perfect relevance - complete and accurate
     * 0.7-0.9: High relevance - minor gaps or imprecisions
     * 0.4-0.6: Moderate relevance - significant gaps
     * 0.1-0.3: Low relevance - major issues
     * 0.0: No relevance - incorrect or off-topic
     */
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should evaluate how factually accurate an LLMs output is compared to the provided context (tool response)', async () => {
    const result = await evaluate(
      weatherAgent,
      'describe the current weather conditions in Balikpapan',
      weatherAgent.evals.faithfulness
    );

    /**
     * 1.0: All claims supported by context
     * 0.7-0.9: Most claims supported, few unverifiable
     * 0.4-0.6: Mixed support with some contradictions
     * 0.1-0.3: Limited support, many contradictions
     * 0.0: No supported claims
     */
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should evaluates whether an LLM generates factually correct information by comparing its output against the provided context', async () => {
    const result = await evaluate(
      weatherAgent,
      'get weather in Balikpapan',
      weatherAgent.evals.hallucination
    );

    /**
     * 1.0: Complete hallucination - contradicts all context statements
     * 0.75: High hallucination - contradicts 75% of context statements
     * 0.5: Moderate hallucination - contradicts half of context statements
     * 0.25: Low hallucination - contradicts 25% of context statements
     * 0.0: No hallucination - output aligns with all context statements
     */
    expect(result.score).toBeLessThanOrEqual(0.25);
  });

  it('should evaluates how strictly an LLMs output follows a set of given prompt instructions, but with no location provided', async () => {
    const result = await evaluate(
      weatherAgent,
      'What is the weather?',
      weatherAgent.evals.promptAlignment
    );

    /**
     * 1.0: All applicable instructions followed perfectly
     * 0.7-0.9: Most applicable instructions followed
     * 0.4-0.6: Mixed compliance with applicable instructions
     * 0.1-0.3: Limited compliance with applicable instructions
     * 0.0: No applicable instructions followed
     */
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should evaluates how strictly an LLMs output follows a set of given prompt instructions, but with multiple locations provided', async () => {
    const result = await evaluate(
      weatherAgent,
      'Give me weather information for Balikpapan and Jakarta',
      weatherAgent.evals.promptAlignment
    );

    /**
     * 1.0: All applicable instructions followed perfectly
     * 0.7-0.9: Most applicable instructions followed
     * 0.4-0.6: Mixed compliance with applicable instructions
     * 0.1-0.3: Limited compliance with applicable instructions
     * 0.0: No applicable instructions followed
     */
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should evaluates how well an LLMs output captures the original texts content while maintaining factual accuracy', async () => {
    const detailedWeatherData = `
      Current weather in Balikpapan: Temperature 28°C, feels like 30°C. 
      Humidity at 75%, wind speed 8 mph from northwest, with gusts up to 12 mph. 
      Partly cloudy conditions with scattered clouds. Visibility is good at 10 miles.
      The weather is sunny and clear.
    `;

    const result = await evaluate(
      weatherAgent,
      detailedWeatherData,
      weatherAgent.evals.summarization
    );

    /**
     * 1.0: Perfect summary - completely factual and covers all key information
     * 0.7-0.9: Strong summary with minor omissions or slight inaccuracies
     * 0.4-0.6: Moderate quality with significant gaps or inaccuracies
     * 0.1-0.3: Poor summary with major omissions or factual errors
     * 0.0: Invalid summary - either completely inaccurate or missing critical information
     */
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should evaluates how thoroughly an LLMs output covers the key elements present in the input', async () => {
    const result = await evaluate(
      weatherAgent,
      'give me the complete weather report for Balikpapan including temperature, humidity, and wind',
      weatherAgent.evals.completeness
    );

    /**
     * 1.0: Complete coverage - contains all input elements
     * 0.7-0.9: High coverage - includes most key elements
     * 0.4-0.6: Partial coverage - contains some key elements
     * 0.1-0.3: Low coverage - missing most key elements
     * 0.0: No coverage - output lacks all input elements
     */
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should evaluates how well an LLMs output covers the important keywords from the input', async () => {
    const result = await evaluate(
      weatherAgent,
      'I need temperature, humidity, wind speed, and weather conditions for Balikpapan',
      weatherAgent.evals.keywordCoverage
    );

    /**
     * 1.0: Perfect keyword coverage
     * 0.7-0.9: Good coverage with most keywords present
     * 0.4-0.6: Moderate coverage with some keywords missing
     * 0.1-0.3: Poor coverage with many keywords missing
     * 0.0: No keyword matches
     */
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should evaluates the texts emotional tone and sentiment consistency', async () => {
    const result = await evaluate(
      weatherAgent,
      'Tell me about the weather in Balikpapan',
      weatherAgent.evals.toneConsistency
    );

    /**
     * 1.0: Perfect tone consistency/stability
     * 0.7-0.9: Strong consistency with minor variations
     * 0.4-0.6: Moderate consistency with noticeable shifts
     * 0.1-0.3: Poor consistency with major tone changes
     * 0.0: No consistency - completely different tones
     */
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });
});
