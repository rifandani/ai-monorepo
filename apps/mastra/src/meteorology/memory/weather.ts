import { Memory } from '@mastra/memory';
import { PgVector } from '@mastra/pg';
import { models } from '@/core/utils/ai';
import { ENV } from '@/core/utils/env';

const vector = new PgVector({
  connectionString: ENV.DATABASE_URL,
  schemaName: 'mastra',
});

/**
 * Initialize memory storage with PostgresStore and vector with PgVector for persistence
 */
export const weatherMemory = new Memory({
  // we don't need to use storage here again, because we are already using it in the main mastra instance
  // storage: new PostgresStore({
  //   connectionString: ENV.DATABASE_URL,
  //   schemaName: 'mastra',
  // }),
  vector,
  embedder: models.embedding004, // or you can use local embedder `import { fastembed } from "@mastra/fastembed"` which uses onnx runtime
  options: {
    lastMessages: 10, // default is 10
    semanticRecall: {
      topK: 2, // default is 2
      messageRange: {
        before: 2, // default is 2
        after: 2, // default is 2
      },
      scope: 'thread', // default is 'thread'. 'thread' is like the chat id, and 'resource' is like the user id or agent id
    },
    workingMemory: {
      enabled: true, // default is false
      //       template: `
      // # User Profile

      // ## Personal Info

      // - Name:
      // - Location:
      // - Timezone:

      // ## Preferences

      // - Communication Style: [e.g., Formal, Casual]
      // `,
    },
  },
});
