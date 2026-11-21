import { mergeConfig } from "vitest/config";
import config from "./vitest.config.ts";

export default mergeConfig(config, {
  test: {
    exclude: ["test/browser/**"],
    server: { deps: { inline: ["@hackersandwizards/scaffolding", "@fast-check/vitest"] } },
  },
});
