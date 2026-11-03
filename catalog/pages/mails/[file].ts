import type { APIRoute, GetStaticPaths } from "astro";
import { mails } from "../../mails";

const TYPES = { html: "text/html", txt: "text/plain", json: "application/json" };

export const getStaticPaths = (() =>
  mails.flatMap((m) =>
    (
      [
        ["html", m.html],
        ["txt", m.text],
        ["json", m.json],
      ] as const
    ).map(([ext, body]) => ({
      params: { file: `${m.base}.${ext}` },
      props: { body, type: TYPES[ext] },
    })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.body as string, {
    headers: { "Content-Type": `${props.type as string}; charset=utf-8` },
  });
