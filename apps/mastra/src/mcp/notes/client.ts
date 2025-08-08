import { Agent } from '@mastra/core/agent';
import { MCPClient } from '@mastra/mcp';
import { models } from '@/core/utils/ai.js';

const notesMcpClient = new MCPClient({
  servers: {
    notes: {
      url: new URL('http://localhost:4111/api/mcp/notes/mcp'),
      enableServerLogs: true,
    },
  },
});

// Create an agent with access to all tools
const agent = new Agent({
  name: 'Notes Agent',
  instructions: 'You have access to the notes tool server.',
  model: models.flash25,
  tools: await notesMcpClient.getTools(),
});

const response = await agent.stream(
  'Create a new note about the concept of ACID in the database'
);

for await (const chunk of response.textStream) {
  process.stdout.write(chunk);
}

notesMcpClient.disconnect();
