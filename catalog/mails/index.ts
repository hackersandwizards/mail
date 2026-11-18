import { parseBrief, renderBrief } from "../../scripts/render";

const raw = import.meta.glob<string>("./*.json", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const mails = await Promise.all(
  Object.entries(raw)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(async ([path, json]) => {
      const brief = parseBrief(json);
      return {
        base: path.replace(/^.*\/|\.json$/g, ""),
        json,
        lang: brief.lang,
        ...(await renderBrief(brief)),
      };
    }),
);
