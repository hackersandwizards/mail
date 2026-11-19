import base from "@hackersandwizards/scaffolding/stryker";

export default {
  ...base,
  mutate: ["components/*.{ts,tsx}", "mails/*.tsx", "scripts/{modes,render}.ts"],
};
