import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: ["react", "react-dom", "motion", "tailwindcss", "lucide-react"],
  treeshake: true,
  sourcemap: true,
  clean: true,
});
