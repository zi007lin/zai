import { defineConfig } from "tsup";

// Bundle src/index.ts into dist/index.js. The score-engine module reaches
// into the parent zai repo's src/lib/scoreSpec.ts via relative import; tsup
// resolves and bundles it so the published package is self-contained.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  dts: true,
  sourcemap: true,
  shims: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
  // Treat MCP SDK as external — it is a runtime dep declared in package.json
  // and will be installed alongside @htu/zai-mcp by npm.
  external: ["@modelcontextprotocol/sdk"],
});
