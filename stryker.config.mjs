import base from "@hackersandwizards/scaffolding/stryker";

export default {
  ...base,
  incremental: false,
  mutate: [
    "components/Image.tsx",
    "components/Item.tsx",
    "components/MailShell.tsx",
    "components/ObjectionNotice.tsx",
    "components/Paragraph.tsx",
    "components/Signature.tsx",
    "components/signature-colours.ts",
    "components/theme.ts",
    "mails/Brief.tsx",
    "scripts/frame-modes.ts",
    "scripts/modes.ts",
    "scripts/render.ts",
    "test/browser/mail-page.ts",
  ],
  vitest: { ...base.vitest, configFile: "vitest.mutation.config.ts" },
};
