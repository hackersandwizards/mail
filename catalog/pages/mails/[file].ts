// /mails/<type>.html, .txt and .json: each mail type's HTML part, text part and data file.
import type { APIRoute, GetStaticPaths } from "astro";
import { mails } from "../../mails";

export const getStaticPaths = (() =>
  mails.flatMap((m) =>
    (
      [
        ["html", m.html],
        ["txt", m.text],
        ["json", m.json],
      ] as const
    ).map(([ext, body]) => ({ params: { file: `${m.base}.${ext}` }, props: { body } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(props.body as string);
