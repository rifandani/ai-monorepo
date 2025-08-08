import { MCPServer } from '@mastra/mcp';
import { notesPrompts } from '@/mcp/notes/prompts.js';
import { notesResources } from '@/mcp/notes/resources.js';
import { writeNoteTool } from '@/mcp/notes/tools.js';

export const notesMcpServer = new MCPServer({
  name: 'notes',
  description: 'A MCP server for managing notes',
  version: '1.0.0',
  resources: notesResources,
  prompts: notesPrompts,
  tools: {
    write: writeNoteTool,
  },
});
