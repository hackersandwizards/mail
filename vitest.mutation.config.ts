import { mergeConfig } from "vitest/config";
import config from "./vitest.config.ts";

export default mergeConfig(config, {
  test: {
    exclude: ["test/browser/**"],
  },
});
