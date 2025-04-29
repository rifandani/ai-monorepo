import { models, textSchema, usageSchema } from '@/core/api/ai';
import { generateObject, generateText, tool } from 'ai';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { validator } from 'hono-openapi/zod';
import type { Variables } from 'hono/types';
import { z } from 'zod';

// For extending the Zod schema with OpenAPI properties
import 'zod-openapi/extend';

async function getCompanyInfo(company: string) {
  const { object } = await generateObject({
    model: models.flash20search,
    system: 'You are an expert researcher and analyst',
    prompt: `For the following company provide:
- a brief company description
- what do they sell / what products do they offer
 
<company>${company}</company>`,
    schema: z.object({
      description: z.string().describe('The description of the company'),
      products: z
        .array(z.string())
        .describe('The products offered by the company'),
    }),
  });

  return object;
}

async function getCompetitors(company: string, num = 2) {
  const { object } = await generateObject({
    model: models.flash20search,
    system: 'You are an expert researcher and analyst',
    prompt: `For the following company provide:
        - find similar competitors (minimum 1, maximum ${num}) to the following company: ${company}.
        - for each competitor, provide a brief description of their product, a link to their website, and an explanation of why they are similar.
 
        <company>${company}</company>`,
    schema: z.object({
      competitors: z
        .array(
          z.object({
            name: z.string().describe('The name of the competitor'),
            description: z
              .string()
              .describe('The description of the competitor'),
            website: z.string().describe('The website of the competitor'),
            similarity: z
              .string()
              .describe(
                'The similarity between the company and the competitor'
              ),
          })
        )
        .min(1)
        .max(num),
    }),
  });

  return object;
}

async function getFounderLatest3Tweets(founder: string) {
  const { object } = await generateObject({
    model: models.flash20search,
    system:
      'You are an expert researcher and analyst who is looking for latest 3 tweets from twitter (X) profile',
    prompt: `Please provide a brief summary of the following person's latest 3 tweets. <person_name>${founder}</person_name>.`,
    schema: z.object({
      tweets: z
        .array(z.string().describe('The tweet from the person'))
        .nullable()
        .describe(
          'The latest 3 tweets from the person, or null if tweets or twitter (X) profile are not found'
        ),
    }),
  });

  return object;
}

async function getFounderLinkedinProfile(founder: string) {
  const { object } = await generateObject({
    model: models.flash20search,
    system:
      "You are an expert researcher and analyst who is looking for founder's background from their linkedin profile",
    prompt: `Please provide a brief summary of the following person's background from their linkedin profile. <person_name>${founder}</person_name>.`,
    schema: z.object({
      background: z
        .string()
        .nullable()
        .describe(
          'The background of the person from their linkedin profile, or null if linkedin profile is not found'
        ),
    }),
  });

  return object;
}

async function getFounderPersonalWebsite(founder: string) {
  const { object } = await generateObject({
    model: models.flash20search,
    system:
      "You are an expert researcher and analyst who is looking for founder's background from their personal website",
    prompt: `Please provide a brief summary of the following person's background from their personal website. <person_name>${founder}</person_name>.`,
    schema: z.object({
      background: z
        .string()
        .nullable()
        .describe(
          'The background of the person from their personal website, or null if personal website is not found'
        ),
    }),
  });

  return object;
}

async function getFounderInfo(founder: string) {
  const founderInfo = await Promise.all([
    getFounderLatest3Tweets(founder),
    getFounderLinkedinProfile(founder),
    getFounderPersonalWebsite(founder),
  ]);

  return founderInfo;
}

async function assessFounderMarketFit({
  founderName,
  companyInfo,
}: {
  founderName: string;
  companyInfo: string;
}) {
  const { text } = await generateText({
    model: models.flash25,
    system:
      'You are a partner at a Venture Capital fund looking to invest in a startup. Assess the market fit of the founder based on the company info.',
    prompt: `<founder_name>${founderName}</founder_name>\n\n<search_results>${JSON.stringify({ companyInfo })}</search_results>`,
  });

  return text;
}

async function getCompanyFinancialInformation(company: string) {
  const { object } = await generateObject({
    model: models.flash20search,
    system: 'You are an expert researcher and analyst',
    prompt: `Tell me about the funding, valuation, investors, and financials information of this company in detail and nothing else. <company>${company}</company>`,
    schema: z.object({
      fundingHistory: z
        .string()
        .nullable()
        .describe(
          'The funding history of the company, or null if funding history is not found'
        ),
      valuation: z
        .string()
        .nullable()
        .describe(
          'The current valuation of the company, or null if valuation is not found'
        ),
      investors: z
        .array(z.string().describe('The investor of the company'))
        .nullable()
        .describe(
          'The collection of investors of the company, or null if investors are not found'
        ),
      financials: z
        .string()
        .nullable()
        .describe(
          'The financials of the company, or null if financials are not found'
        ),
    }),
  });

  return object;
}

async function generateInvestmentPitch(company: string, research: string) {
  const { text } = await generateText({
    model: models.pro25,
    system: 'You are an expert researcher and analyst',
    prompt: `Generate an investment pitch for ${company} from the perspective of a venture capitalist.\n\n${research}`,
  });

  return text;
}
export const ventureCapitalApp = new Hono<{
  Variables: Variables;
}>(); // .basePath('/api/v1');

ventureCapitalApp.post(
  '/',
  describeRoute({
    description: 'Generate an investment pitch for a company',
    responses: {
      200: {
        description: 'The investment pitch',
        content: {
          'application/json': {
            schema: z.object({
              text: textSchema,
              usage: usageSchema,
            }),
          },
        },
      },
    },
  }),
  validator(
    'json',
    z.object({
      prompt: z
        .string()
        .describe('The prompt for the investment pitch to invest in a company')
        .openapi({
          example:
            'Please write an investment pitch for investing in the NVIDIA',
        }),
    })
  ),
  async (c) => {
    const { prompt } = c.req.valid('json');

    const { text, usage } = await generateText({
      model: models.flash25,
      prompt,
      maxSteps: 10,
      tools: {
        getCompanyInfo: tool({
          description: 'Get information about a company',
          parameters: z.object({
            companyName: z.string(),
          }),
          execute: async ({ companyName }) => {
            return await getCompanyInfo(companyName);
          },
        }),
        getCompetitors: tool({
          description: 'Get competitors of a company',
          parameters: z.object({
            companyName: z.string(),
          }),
          execute: async ({ companyName }) => {
            return await getCompetitors(companyName);
          },
        }),
        getFounderInfo: tool({
          description:
            'Get information (tweets, personal website, linkedin profile) about a founder of a company',
          parameters: z.object({
            founderName: z.string(),
          }),
          execute: async ({ founderName }) => {
            return await getFounderInfo(founderName);
          },
        }),
        assessFounderMarketFit: tool({
          description:
            'Assess the market fit of the founder of a company based on the company info',
          parameters: z.object({
            founderName: z.string(),
            companyInfo: z.string(),
          }),
          execute: async ({ founderName, companyInfo }) => {
            return await assessFounderMarketFit({ founderName, companyInfo });
          },
        }),
        getCompanyFinancialInformation: tool({
          description:
            'Get financial information about a company, including funding history, valuation, investors, and financials',
          parameters: z.object({
            companyName: z.string(),
          }),
          execute: async ({ companyName }) => {
            return await getCompanyFinancialInformation(companyName);
          },
        }),
        generateInvestmentPitch: tool({
          description:
            'Generate an investment pitch for a company based on the company info, competitors, founder info, and financial information',
          parameters: z.object({
            companyName: z.string(),
            competitors: z.array(z.string()).min(1),
            founderInfo: z.string(),
            companyInfo: z.string(),
            companyFinancialInformation: z.string(),
          }),
          execute: async ({
            companyName,
            competitors,
            companyInfo,
            founderInfo,
            companyFinancialInformation,
          }) => {
            return await generateInvestmentPitch(
              companyName,
              JSON.stringify({
                competitors,
                companyInfo,
                founderInfo,
                companyFinancialInformation,
              })
            );
          },
        }),
      },
    });

    return c.json({ text, usage });
  }
);
