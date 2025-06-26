import { Agent } from '@mastra/core/agent';
import {
  AnswerRelevancyMetric,
  FaithfulnessMetric,
  HallucinationMetric,
  PromptAlignmentMetric,
  SummarizationMetric,
} from '@mastra/evals/llm';
import {
  CompletenessMetric,
  KeywordCoverageMetric,
  ToneConsistencyMetric,
} from '@mastra/evals/nlp';
import { models } from '@/core/utils/ai';
import { weatherMemory } from '@/meteorology/memory/weather';
import { weatherTool } from '@/meteorology/tools/weather';

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`,
  model: models.flash25,
  tools: { weatherTool },
  memory: weatherMemory,
  evals: {
    // evaluates how well an LLM's output answers or addresses the input query
    answerRelevancy: new AnswerRelevancyMetric(models.flash25, {
      scale: 1, // maximum score value. default is 1
      uncertaintyWeight: 0.5, // weight given to 'unsure' verdicts in scoring (0-1). default is 0.3
    }),

    // evaluates how factually accurate an LLM’s output is compared to the provided context (tool response)
    faithfulness: new FaithfulnessMetric(models.flash25, {
      scale: 1, // maximum score value. the final score will be normalized to this scale. default is 1
      context: [], // array of context chunks against which the output's claims will be verified.
    }),

    // Prevent fabricating weather data not provided by the tool
    hallucination: new HallucinationMetric(models.flash25, {
      scale: 1,
      context: [], // Context will be the actual weather data from weatherTool
    }),

    // Ensure agent follows weather assistant instructions
    promptAlignment: new PromptAlignmentMetric(models.flash25, {
      instructions: [
        'Ask for location if none is provided in the query',
        'Include temperature information when providing weather data',
        'Include humidity information when available',
        'Include wind speed information when available',
        'Keep response concise but informative',
        'Use proper location names for weather queries',
        'Provide current weather conditions when requested',
      ],
      scale: 1,
    }),

    // Test coverage of key weather information elements
    completeness: new CompletenessMetric(),

    // Ensure weather-related keywords are properly covered
    keywordCoverage: new KeywordCoverageMetric(),

    // Maintain helpful and professional tone
    toneConsistency: new ToneConsistencyMetric(),

    // Test ability to summarize weather conditions effectively
    summarization: new SummarizationMetric(models.flash25, {
      scale: 1,
    }),
  },
});
