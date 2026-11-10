import { renderBrief } from "../../scripts/render";

const raw = import.meta.glob<string>("./*.json", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const mails = await Promise.all(
  Object.entries(raw)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(async ([path, json]) => ({
      base: path.replace(/^.*\/|\.json$/g, ""),
      json,
      ...(await renderBrief(JSON.parse(json))),
    })),
);
