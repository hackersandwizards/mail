import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { defineConfig } from "astro/config";
import { catalog } from "@hackersandwizards/scaffolding/catalog";

// The catalog: every component and the whole mail as stories at /catalog, and every mail type
// composed by the engine at /mails/ (pages/mails/), each as the HTML and text part mail-render
// writes. A story shows the rendered mail in a frame, as the HTML a client receives.
// Published as a project Pages site at https://hackersandwizards.github.io/mail/, hence the base;
// Astro leaves a redirect's destination as written, so each names it.
const BASE = "/mail";

export default defineConfig({
  base: BASE,
  srcDir: ".",
  devToolbar: { enabled: false },
  server: { host: "127.0.0.1", port: 4455 },
  // CATALOG_FILE=1 builds pages brand-elements opens from disk, where they find their stylesheets by
  // file URL (check:elements); the published build keeps root-relative assets.
  ...(process.env.CATALOG_FILE && {
    build: { assetsPrefix: pathToFileURL(new URL("../dist/", import.meta.url).pathname).href },
  }),
  redirects: {
    "/": `${BASE}/catalog`,
    "/design-system": `${BASE}/catalog`,
    "/specimen": `${BASE}/mails`,
  },
  integrations: [
    catalog({
      product: "Mail",
      lead: "Every mail and building block of the mail engine, rendered to the HTML a mail client receives and shown in a 600 px frame. Each tile opens its light and dark states; the data is made up.",
      css: ["@hackersandwizards/brand/tokens.root.css", "@hackersandwizards/brand/elements.css"],
      head: "./Head.astro",
      home: "./Home.astro",
      groupOrder: ["Mails", "Parts"],
      previewSize: [602, 400],
      // A tile draws the mail as sent: light, with its images loaded.
      previewStates: ["light", "loaded"],
      // The image a mail's data names by a relative path, as a sent mail names its URL.
      copy: ["node_modules/@hackersandwizards/brand/logos/lockup-compact.png"],
    }),
    // Astrobook's route (written into the preset's folder) keeps a `client:load` branch for framework components, which would bundle
    // each story module, node:fs included, for the browser. Every story here is the Astro frame.
    {
      name: "astrobook-server-only",
      hooks: {
        "astro:config:setup": ({ config }) => {
          const dir = new URL(
            ".astro/integrations/_hackersandwizards_scaffolding_catalog/",
            config.root,
          );
          for (const file of readdirSync(dir, { recursive: true }) as string[]) {
            if (!file.endsWith(".astro")) continue;
            const path = new URL(file, dir);
            writeFileSync(path, readFileSync(path, "utf8").replace(" client:load />", " />"));
          }
        },
      },
    },
  ],
});
