import type { TestSuiteConfig } from 'promptfoo';

export const testSuite = {
  description:
    'Simple test suite hitting http://localhost:3333/gemini/generate',
  providers: [
    {
      id: 'google:gemini-2.5-flash-preview-05-20',
      label: 'gemini-2.5-flash',
      prompts: ['simple_prompt'],
    },
    {
      id: 'google:gemini-2.0-flash-001',
      label: 'gemini-2.0-flash',
      prompts: ['simple_prompt'],
    },
  ],
  prompts: [
    {
      label: 'simple_prompt',
      raw: 'You are an expert literary translator.\nTranslate this text to {{targetLanguage}}, preserving tone and cultural nuances: {{text}}',
    },
  ],
  tests: [
    {
      vars: {
        languageTarget: 'Indonesian',
        text: 'Hello world',
      },
      assert: [
        {
          type: 'contains',
          value: 'Dunia',
        },
      ],
    },
  ],
  writeLatestResults: true,
} satisfies TestSuiteConfig;
