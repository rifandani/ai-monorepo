import { evaluate } from '@mastra/evals';
import { describe, expect, it } from 'vitest';
import { weatherAgent } from './weather';

describe('Weather Agent Evaluations', () => {
  it('should provide relevant answers for weather queries', async () => {
    const result = await evaluate(
      weatherAgent,
      'what is the weather like in balikpapan?',
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

  it('should be faithful to weather tool data', async () => {
    const result = await evaluate(
      weatherAgent,
      'describe the current weather conditions in jakarta',
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

  it('should ask for location when none is provided', async () => {
    const result = await evaluate(
      weatherAgent,
      'What is the weather?',
      weatherAgent.evals.promptAlignment
    );

    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should maintain helpful tone consistently', async () => {
    const result = await evaluate(
      weatherAgent,
      'Tell me about the weather in London',
      weatherAgent.evals.toneConsistency
    );

    // Should maintain professional, helpful tone
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it('should provide complete weather information', async () => {
    const result = await evaluate(
      weatherAgent,
      'Give me the complete weather report for Tokyo including temperature, humidity, and wind',
      weatherAgent.evals.completeness
    );

    // Should include all requested weather elements
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should cover weather-related keywords properly', async () => {
    const result = await evaluate(
      weatherAgent,
      'I need temperature, humidity, wind speed, and weather conditions for Paris',
      weatherAgent.evals.keywordCoverage
    );

    // Should cover temperature, humidity, wind speed keywords
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it('should not hallucinate weather data', async () => {
    // Note: This would need actual weather tool response as context
    const result = await evaluate(
      weatherAgent,
      'What is the weather in Sydney?',
      weatherAgent.evals.hallucination
    );

    // Should have low hallucination score (closer to 0 is better)
    expect(result.score).toBeLessThan(0.3);
  });

  it('should effectively summarize weather conditions', async () => {
    const detailedWeatherData = `
      Current weather in Seattle: Temperature 68°F (20°C), feels like 70°F (21°C). 
      Humidity at 75%, wind speed 8 mph from northwest, with gusts up to 12 mph. 
      Partly cloudy conditions with scattered clouds. Visibility is good at 10 miles.
    `;

    const result = await evaluate(
      weatherAgent,
      detailedWeatherData,
      weatherAgent.evals.summarization
    );

    // Should effectively summarize weather information
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should follow prompt alignment for weather assistant role', async () => {
    const result = await evaluate(
      weatherAgent,
      'Can you give me weather information for multiple cities?',
      weatherAgent.evals.promptAlignment
    );

    // Should align with weather assistant instructions
    expect(result.score).toBeGreaterThanOrEqual(0.6);
  });
});
