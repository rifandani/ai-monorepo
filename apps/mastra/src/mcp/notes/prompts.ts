import type { MCPServerPrompts } from '@mastra/mcp';
import matter from 'gray-matter';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Node } from 'unist';

const prompts = [
  {
    name: 'new_daily_note',
    description: 'Create a new daily note.',
    version: '1.0.0',
  },
  {
    name: 'summarize_note',
    description: 'Give me a TL;DR of the note.',
    version: '1.0.0',
  },
  {
    name: 'brainstorm_ideas',
    description: 'Brainstorm new ideas based on a note.',
    version: '1.0.0',
  },
];

function stringifyNode(node: Node): string {
  // Extract text value if node has a direct string value property
  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }

  // Recursively process child nodes and concatenate their text content
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(stringifyNode).join('');
  }

  // Return empty string for nodes without text content or children
  return '';
}

export function analyzeMarkdown(md: string) {
  // Extract content from frontmatter if present, otherwise use the full markdown
  const { content } = matter(md);

  // Parse markdown into an AST (Abstract Syntax Tree) for structured analysis
  const tree = unified().use(remarkParse).parse(content);

  // Initialize data structures to track document structure
  const headings: string[] = [];
  const wordCounts: Record<string, number> = {};

  // Start with a default section for content before any heading
  let currentHeading = 'untitled';
  wordCounts[currentHeading] = 0;

  // Iterate through each node in the parsed markdown tree
  for (const node of tree.children) {
    // Check if this is a level 2 heading (## heading)
    if (node.type === 'heading' && node.depth === 2) {
      // Extract the heading text and start a new section
      currentHeading = stringifyNode(node);
      headings.push(currentHeading);
      wordCounts[currentHeading] = 0;
    } else {
      // For non-heading nodes, extract text content and count words
      const textContent = stringifyNode(node);
      if (textContent.trim()) {
        // Split by whitespace and add word count to current section
        wordCounts[currentHeading] =
          (wordCounts[currentHeading] || 0) + textContent.split(/\\s+/).length;
      }
    }
  }

  // Return structured analysis of the markdown document
  return { headings, wordCounts };
}

// biome-ignore lint/suspicious/useAwait: xxx
const getPromptMessages: MCPServerPrompts['getPromptMessages'] = async ({
  name,
  args,
}) => {
  switch (name) {
    case 'new_daily_note': {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a new note titled "${today}" with sections: "## Tasks", "## Meetings", "## Notes".`,
          },
        },
      ];
    }
    case 'summarize_note': {
      // Check if note content is provided
      if (!args?.noteContent) {
        throw new Error('No content provided');
      }

      // Analyze the note content
      const metaSum = analyzeMarkdown(args.noteContent as string);

      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Summarize each section in ≤ 3 bullets.\\n\\n### Outline\\n${metaSum.headings.map((h) => `- ${h} (${metaSum.wordCounts[h] || 0} words)`).join('\\n')}`.trim(),
          },
        },
      ];
    }
    case 'brainstorm_ideas': {
      // Check if note content is provided
      if (!args?.noteContent) {
        throw new Error('No content provided');
      }

      const metaBrain = analyzeMarkdown(args.noteContent as string);

      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Brainstorm 3 ideas for underdeveloped sections below ${args?.topic ? `on ${args.topic}` : '.'}\\n\\nUnderdeveloped sections:\\n${metaBrain.headings.length ? metaBrain.headings.map((h) => `- ${h}`).join('\\n') : '- (none, pick any)'}`,
          },
        },
      ];
    }
    default:
      throw new Error(`Prompt "${name}" not found`);
  }
};

export const notesPrompts: MCPServerPrompts = {
  listPrompts: async () => prompts,
  getPromptMessages,
};
