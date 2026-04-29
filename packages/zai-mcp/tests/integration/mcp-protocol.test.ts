import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "../../src/index.js";
import { _resetRateLimits } from "../../src/rate-limit.js";

// End-to-end protocol test: pair an MCP Client to our Server via the
// SDK's in-memory transport, exercise tools/list and tools/call.

const SAMPLE_CHORE = `# chore: integration

**Repo:** \`zi007lin/zai\`

## Intent
sample.

## Action
none.

## Acceptance Criteria
- [ ] passes

## Files
\`\`\`
none (new)
\`\`\`

## Legal triggers
None.
`;

describe("MCP protocol end-to-end", () => {
  beforeEach(() => _resetRateLimits());

  it("lists exactly one tool: score_spec", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createServer();
    const client = new Client(
      { name: "test-client", version: "0.0.0" },
      { capabilities: {} }
    );
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const list = await client.request({ method: "tools/list" }, ListToolsResultSchema);
    expect(list.tools.length).toBe(1);
    expect(list.tools[0].name).toBe("score_spec");

    await client.close();
    await server.close();
  });

  it("calls score_spec and returns a JSON-encoded text result", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createServer();
    const client = new Client(
      { name: "test-client", version: "0.0.0" },
      { capabilities: {} }
    );
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: "score_spec",
          arguments: { content: SAMPLE_CHORE, type: "chore" },
        },
      },
      CallToolResultSchema
    );

    expect(result.isError).toBeFalsy();
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text
    );
    expect(parsed.type).toBe("chore");
    expect(typeof parsed.passed).toBe("boolean");
    expect(Array.isArray(parsed.checks)).toBe(true);

    await client.close();
    await server.close();
  });

  it("returns isError=true for unknown tool", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createServer();
    const client = new Client(
      { name: "test-client", version: "0.0.0" },
      { capabilities: {} }
    );
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.request(
      {
        method: "tools/call",
        params: { name: "nonexistent", arguments: {} },
      },
      CallToolResultSchema
    );

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text
    );
    expect(parsed.error).toBe("unknown_tool");

    await client.close();
    await server.close();
  });
});
