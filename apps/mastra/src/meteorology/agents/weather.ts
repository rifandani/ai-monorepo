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
    // it uses a judge-based system to determine relevancy and provides detailed scoring and reasoning.
    answerRelevancy: new AnswerRelevancyMetric(models.flash20, {
      scale: 1, // maximum score value. default is 1
      uncertaintyWeight: 0.5, // weight given to 'unsure' verdicts in scoring (0-1). default is 0.3
    }),

    // evaluates how factually accurate an LLM’s output is compared to the provided context (tool response)
    // it extracts claims from the output and verifies them against the context, making it essential to measure RAG pipeline responses’ reliability.
    faithfulness: new FaithfulnessMetric(models.flash20, {
      scale: 1, // maximum score value. the final score will be normalized to this scale. default is 1
      context: [], // array of context chunks against which the output's claims will be verified.
    }),

    // evaluates whether an LLM generates factually correct information by comparing its output against the provided context.
    // it measures hallucination by identifying direct contradictions between the context and the output.
    // similar to faithfulness, but there is no "unsure" verdict
    hallucination: new HallucinationMetric(models.flash20, {
      scale: 1, // maximum score value. default is 1
      context: [], // array of context pieces used as the source of truth
    }),

    // evaluates how strictly an LLM’s output follows a set of given prompt instructions.
    // it uses a judge-based system to verify each instruction is followed exactly and provides detailed reasoning for any deviations.
    promptAlignment: new PromptAlignmentMetric(models.flash20, {
      scale: 1,
      instructions: [
        'Always ask for a location if none is provided',
        "If the location name isn't in English, please translate it",
        'If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")',
        'Include relevant details like humidity, wind conditions, and precipitation',
        'Keep responses concise but informative',
      ],
    }),

    // evaluates how well an LLM’s summary captures the original text’s content while maintaining factual accuracy.
    // it combines two aspects: alignment (factual correctness) and coverage (inclusion of key information), using the minimum scores to ensure both qualities are necessary for a good summary.
    summarization: new SummarizationMetric(models.flash20, {
      scale: 1,
    }),

    // evaluates how thoroughly an LLM’s output covers the key elements present in the input.
    // it analyzes nouns, verbs, topics, and terms to determine coverage and provides a detailed completeness score.
    completeness: new CompletenessMetric(),

    // evaluates how well an LLM’s output covers the important keywords from the input.
    // it analyzes keyword presence and matches while ignoring common words and stop words.
    // use `keyword-extractor` under the hood
    keywordCoverage: new KeywordCoverageMetric(),

    // evaluates the text’s emotional tone and sentiment consistency.
    // it can operate in two modes: comparing tone between input/output pairs or analyzing tone stability within a single text.
    toneConsistency: new ToneConsistencyMetric(),
  },
});
