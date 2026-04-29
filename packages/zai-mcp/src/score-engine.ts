// Re-export of zai's rubric scoring engine. tsup resolves this relative
// path and bundles the engine into the published package, so end users
// never need the zai repo present at runtime.
export {
  scoreSpec,
  KNOWN_TYPES,
  type ScoreResult,
  type SpecType,
  type SectionStatus,
} from "../../../src/lib/scoreSpec.js";
