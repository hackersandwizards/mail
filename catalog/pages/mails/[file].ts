import type { APIRoute, GetStaticPaths } from "astro";
import { mails } from "../../mails";

export const getStaticPaths = (() =>
  mails.flatMap((m) =>
    (
      [
        ["html", m.html, "text/html"],
        ["txt", m.text, "text/plain"],
        ["json", m.json, "application/json"],
      ] as const
    ).map(([ext, body, type]) => ({ params: { file: `${m.base}.${ext}` }, props: { body, type } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.body, { headers: { "Content-Type": `${props.type}; charset=utf-8` } });
