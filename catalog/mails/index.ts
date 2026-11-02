// Every mail type of the catalog: its data file beside this file and the parts the engine renders
// from it, the same call mail-render makes. All data is invented.
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
