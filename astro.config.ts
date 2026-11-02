import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { defineConfig } from "astro/config";
import astrobook from "astrobook";

// The design system: every component and the whole mail as stories at /design-system, its home in
// brand's catalogue shape (stories/Home.astro). A story shows the rendered mail in a frame, as the
// HTML a client receives, not the components in the page.
export default defineConfig({
  devToolbar: { enabled: false },
  server: { host: "127.0.0.1", port: 4455 },
  // brand-elements reads the built home from disk, where it finds its stylesheets by file URL.
  build: { assetsPrefix: pathToFileURL(new URL("dist/", import.meta.url).pathname).href },
  integrations: [
    astrobook({
      directory: "stories",
      subpath: "/design-system",
      title: "Mail design system",
      css: ["@hackersandwizards/brand/tokens.root.css", "@hackersandwizards/brand/elements.css"],
      head: "./stories/Head.astro",
      home: "./stories/Home.astro",
    }),
    // Astrobook's route keeps a `client:load` branch for framework components, which would bundle
    // each story module, node:fs included, for the browser. Every story here is the Astro frame.
    {
      name: "astrobook-server-only",
      hooks: {
        "astro:config:setup": ({ config }) => {
          const dir = new URL(".astro/integrations/astrobook/", config.root);
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
