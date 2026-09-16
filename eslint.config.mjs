import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored from numa-lumi-branding-v2 by scripts/sync-lumi3d.mjs and never
    // hand-edited, so lint findings here are unactionable by construction. It
    // is also react-three-fiber's normal idiom — materials built once in a
    // useMemo and mutated per frame — which react-hooks/immutability rejects
    // wholesale. Fix anything real upstream and re-sync.
    "components/lumi3d/vendor/**",
    // Same arrangement for the knot: written by scripts/sync-lumi-knot.mjs
    // from numa-lumi-branding, never hand-edited.
    "components/lumi-knot/vendor/**",
  ]),
  {
    // The react-three-fiber boundary. A frame loop's whole job is to mutate
    // holders sixty times a second without re-rendering — react-hooks'
    // immutability and ref rules are written for render-phase purity and
    // reject that idiom outright. Scoped to the seam so the rules keep
    // working everywhere else in the app.
    files: ["components/lumi3d/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
