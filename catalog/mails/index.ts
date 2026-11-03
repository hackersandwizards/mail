import type { BriefProps } from "../../mails/Brief";
import { renderBrief } from "../../scripts/render";

const raw = import.meta.glob<string>("./*.json", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const mails = await Promise.all(
  Object.entries(raw)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(async ([path, json]) => {
      const data: BriefProps = JSON.parse(json);
      return { base: path.replace(/^.*\/|\.json$/g, ""), json, data, ...(await renderBrief(data)) };
    }),
);
