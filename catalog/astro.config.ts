import { defineConfig } from "astro/config";
import { catalog } from "@hackersandwizards/scaffolding/catalog";

// Astro leaves a redirect's destination as written, so each names the base.
const BASE = "/mail";

export default defineConfig({
  base: BASE,
  srcDir: ".",
  devToolbar: { enabled: false },
  server: { host: "127.0.0.1", port: 4455 },
  redirects: {
    "/design-system": `${BASE}/`,
    "/specimen": `${BASE}/`,
  },
  integrations: [
    catalog({
      product: "Mail",
      lead: "Every mail and building block of the mail engine, rendered to the HTML a mail client receives and shown in a 600 px frame. Each tile opens its light and dark states; the data is made up.",
      css: ["@hackersandwizards/brand/tokens.root.css", "@hackersandwizards/brand/elements.css"],
      head: "./Head.astro",
      // Dense on every page, the mails in the frames keeping their own sizes.
      storyScale: "dense",
      htmlClass: ["hw-focus-ring"],
      home: "./Home.astro",
      groupOrder: ["Mails", "Parts"],
      previewSize: [602, 400],
      // A tile draws the mail as sent: light, with its images loaded.
      previewStates: ["light", "loaded"],
      // The image a mail's data names by a relative path, as a sent mail names its URL, served at
      // its package path; the preset resolves it through brand's exports.
      copy: ["@hackersandwizards/brand/logos/icon-maskable-512.png"],
      // Every story is the Astro frame, so no story module ships to the browser.
      serverOnly: true,
    }),
  ],
});
