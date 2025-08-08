import { Stagehand } from '@browserbasehq/stagehand';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ENV } from '@/core/constants/env.js';
import { OtelLogger } from '@/core/utils/logger.js';

const logger = new OtelLogger({ name: 'mastra', level: 'info' });

class StagehandSessionManager {
  private static instance: StagehandSessionManager;
  private stagehand: Stagehand | null = null;
  private initialized = false;
  private lastUsed = Date.now();
  private readonly sessionTimeout = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    // Schedule session cleanup to prevent memory leaks
    setInterval(() => this.checkAndCleanupSession(), 60 * 1000);
  }

  /**
   * Get the singleton instance of StagehandSessionManager
   */
  static getInstance(): StagehandSessionManager {
    if (!StagehandSessionManager.instance) {
      StagehandSessionManager.instance = new StagehandSessionManager();
    }
    return StagehandSessionManager.instance;
  }

  /**
   * Ensure Stagehand is initialized and return the instance
   */
  async ensureStagehand(): Promise<Stagehand> {
    this.lastUsed = Date.now();

    try {
      // Initialize if not already initialized
      if (!(this.stagehand && this.initialized)) {
        logger.info('Creating new Stagehand instance');
        this.stagehand = new Stagehand({
          // apiKey: process.env.BROWSERBASE_API_KEY!,
          // projectId: process.env.BROWSERBASE_PROJECT_ID!,
          env: 'LOCAL',
          modelName: 'google/gemini-2.0-flash',
          modelClientOptions: {
            apiKey: ENV.GOOGLE_GENERATIVE_AI_API_KEY,
          },
        });

        try {
          logger.info('Initializing Stagehand...');
          await this.stagehand.init();

          this.initialized = true;
          return this.stagehand;
        } catch (initError) {
          logger.error('Failed to initialize Stagehand:', {
            error: (initError as Error).message,
          });
          throw initError;
        }
      }

      try {
        const title = await this.stagehand.page.evaluate(() => document.title);
        logger.info('Session check successful, page title:', { title });
        return this.stagehand;
      } catch (error) {
        // If we get an error indicating the session is invalid, reinitialize
        logger.error('Session check failed:', {
          error: (error as Error).message,
        });
        if (
          error instanceof Error &&
          (error.message.includes(
            'Target page, context or browser has been closed'
          ) ||
            error.message.includes('Session expired') ||
            error.message.includes('context destroyed'))
        ) {
          logger.info('Browser session expired, reinitializing Stagehand...');
          this.stagehand = new Stagehand({
            // apiKey: process.env.BROWSERBASE_API_KEY!,
            // projectId: process.env.BROWSERBASE_PROJECT_ID!,
            env: 'LOCAL',
            modelName: 'google/gemini-2.0-flash',
            modelClientOptions: {
              apiKey: ENV.GOOGLE_GENERATIVE_AI_API_KEY,
            },
          });
          await this.stagehand.init();
          this.initialized = true;
          return this.stagehand;
        }
        throw error; // Re-throw if it's a different type of error
      }
    } catch (error) {
      this.initialized = false;
      this.stagehand = null;
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to initialize/reinitialize Stagehand: ${errorMsg}`
      );
    }
  }

  /**
   * Close the Stagehand session if it's been idle for too long
   */
  private async checkAndCleanupSession(): Promise<void> {
    if (!(this.stagehand && this.initialized)) {
      return;
    }

    const now = Date.now();
    if (now - this.lastUsed > this.sessionTimeout) {
      logger.info('Cleaning up idle Stagehand session');
      try {
        await this.stagehand.close();
      } catch (error) {
        logger.error(`Error closing idle session: ${error}`);
      }
      this.stagehand = null;
      this.initialized = false;
    }
  }

  /**
   * Manually close the session
   */
  async close(): Promise<void> {
    if (this.stagehand) {
      try {
        await this.stagehand.close();
      } catch (error) {
        logger.error(`Error closing Stagehand session: ${error}`);
      }
      this.stagehand = null;
      this.initialized = false;
    }
  }
}

// Get the singleton instance
const sessionManager = StagehandSessionManager.getInstance();

export const stagehandActTool = createTool({
  id: 'web-act',
  description: 'Take an action on a webpage using Stagehand',
  inputSchema: z.object({
    url: z
      .string()
      .optional()
      .describe('URL to navigate to (optional if already on a page)'),
    action: z
      .string()
      .describe(
        'Action to perform (e.g., "click sign in button", "type hello in search field")'
      ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    return await performWebAction(context.url, context.action);
  },
});

export const stagehandObserveTool = createTool({
  id: 'web-observe',
  description: 'Observe elements on a webpage using Stagehand to plan actions',
  inputSchema: z.object({
    url: z
      .string()
      .optional()
      .describe('URL to navigate to (optional if already on a page)'),
    instruction: z
      .string()
      .describe('What to observe (e.g., "find the sign in button")'),
  }),
  outputSchema: z.array(z.any()).describe('Array of observable actions'),
  execute: async ({ context }) => {
    return await performWebObservation(context.url, context.instruction);
  },
});

export const stagehandExtractTool = createTool({
  id: 'web-extract',
  description: 'Extract data from a webpage using Stagehand',
  inputSchema: z.object({
    url: z
      .string()
      .optional()
      .describe('URL to navigate to (optional if already on a page)'),
    instruction: z
      .string()
      .describe('What to extract (e.g., "extract all product prices")'),
    schema: z
      .record(z.any())
      .optional()
      .describe('Zod schema definition for data extraction'),
    useTextExtract: z
      .boolean()
      .optional()
      .describe(
        'Set true for larger-scale extractions, false for small extractions'
      ),
  }),
  outputSchema: z.any().describe('Extracted data according to schema'),
  execute: async ({ context }) => {
    // Create a default schema if none is provided
    const defaultSchema = {
      content: z.string(),
    };

    return await performWebExtraction(
      context.url,
      context.instruction,
      context.schema || defaultSchema,
      context.useTextExtract
    );
  },
});

const performWebAction = async (url?: string, action?: string) => {
  const stagehand = await sessionManager.ensureStagehand();
  const page = stagehand.page;

  try {
    // Navigate to the URL if provided
    if (url) {
      await page.goto(url);
    }

    // Perform the action
    if (action) {
      await page.act(action);
    }

    return {
      success: true,
      message: `Successfully performed: ${action}`,
    };
    // biome-ignore lint/suspicious/noExplicitAny: xxx
  } catch (error: any) {
    throw new Error(`Stagehand action failed: ${error.message}`);
  }
};

const performWebObservation = async (url?: string, instruction?: string) => {
  logger.info(
    `Starting observation${url ? ` for ${url}` : ''} with instruction: ${instruction}`
  );

  try {
    const stagehand = await sessionManager.ensureStagehand();
    if (!stagehand) {
      logger.error('Failed to get Stagehand instance');
      throw new Error('Failed to get Stagehand instance');
    }

    const page = stagehand.page;
    if (!page) {
      logger.error('Page not available');
      throw new Error('Page not available');
    }

    try {
      // Navigate to the URL if provided
      if (url) {
        logger.info(`Navigating to ${url}`);
        await page.goto(url);
      }

      // Observe the page
      if (instruction) {
        logger.info(`Observing with instruction: ${instruction}`);
        try {
          const actions = await page.observe(instruction);
          logger.info(
            `Observation successful, found ${actions.length} actions`
          );
          return actions;
        } catch (observeError) {
          logger.error('Error during observation:', {
            error: (observeError as Error).message,
          });
          throw observeError;
        }
      }

      return [];
    } catch (pageError) {
      logger.error('Error in page operation:', {
        error: (pageError as Error).message,
      });
      throw pageError;
    }
    // biome-ignore lint/suspicious/noExplicitAny: xxx
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Full stack trace for observation error:', error);
    throw new Error(`Stagehand observation failed: ${errorMessage}`);
  }
};

const performWebExtraction = async (
  url?: string,
  instruction?: string,
  // biome-ignore lint/suspicious/noExplicitAny: xxx
  schemaObj?: Record<string, any>,
  useTextExtract = false
) => {
  logger.info(
    `Starting extraction${url ? ` for ${url}` : ''} with instruction: ${instruction}`
  );

  try {
    const stagehand = await sessionManager.ensureStagehand();
    const page = stagehand.page;

    try {
      // Navigate to the URL if provided
      if (url) {
        logger.info(`Navigating to ${url}`);
        await page.goto(url);
      }

      // Extract data
      if (instruction) {
        logger.info(`Extracting with instruction: ${instruction}`);

        // Create a default schema if none is provided from Mastra Agent
        const finalSchemaObj = schemaObj || { content: z.string() };

        try {
          const schema = z.object(finalSchemaObj);

          const result = await page.extract({
            instruction,
            schema,
            useTextExtract,
          });

          logger.info('Extraction successful:', result);
          return result;
        } catch (extractError) {
          logger.error('Error during extraction:', {
            error: (extractError as Error).message,
          });
          throw extractError;
        }
      }

      return null;
    } catch (pageError) {
      logger.error('Error in page operation:', {
        error: (pageError as Error).message,
      });
      throw pageError;
    }
    // biome-ignore lint/suspicious/noExplicitAny: xxx
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Full stack trace for extraction error:', error);
    throw new Error(`Stagehand extraction failed: ${errorMessage}`);
  }
};

// Add a navigation tool for convenience
export const stagehandNavigateTool = createTool({
  id: 'web-navigate',
  description: 'Navigate to a URL in the browser',
  inputSchema: z.object({
    url: z.string().describe('URL to navigate to'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    title: z.string().optional(),
    currentUrl: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const stagehand = await sessionManager.ensureStagehand();

      // Navigate to the URL
      await stagehand.page.goto(context.url);

      // Get page title and current URL
      const title = await stagehand.page.evaluate(() => document.title);
      const currentUrl = await stagehand.page.evaluate(
        () => window.location.href
      );

      return {
        success: true,
        title,
        currentUrl,
      };
      // biome-ignore lint/suspicious/noExplicitAny: xxx
    } catch (error: any) {
      return {
        success: false,
        message: `Navigation failed: ${error.message}`,
      };
    }
  },
});
