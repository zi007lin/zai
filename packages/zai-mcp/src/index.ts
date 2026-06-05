// MCP server entry — stdio transport only. Spawned by Claude Desktop /
// Cursor / Cline / any MCP-capable client via `npx -y @htu/zai-mcp`.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SCORE_SPEC_TOOL, handleScoreSpec } from "./tools/score-spec.js";

const SERVER_NAME = "@htu/zai-mcp";
const SERVER_VERSION = "0.1.0";

export function createServer(): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [SCORE_SPEC_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === SCORE_SPEC_TOOL.name) {
      const result = handleScoreSpec(args ?? {});
      const isError = "error" in result;
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError,
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: "unknown_tool", name }, null, 2),
        },
      ],
      isError: true,
    };
  });

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // The server now drives stdin/stdout. Do not write to stdout from here —
  // the transport owns it. Any logging must go to stderr; we keep stderr
  // silent during normal operation per acceptance criterion.
}

// Run only when invoked as the entry point (preserves importability for
// tests that pull createServer directly).
const isEntry =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1] ?? "");

if (isEntry) {
  main().catch((err) => {
    process.stderr.write(`fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
