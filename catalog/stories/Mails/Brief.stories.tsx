import { renderBrief } from "../../../scripts/render";
import type { BriefProps } from "../../../mails/Brief";
import brief from "../../mails/brief.json";
import { forceInvert } from "../../../scripts/modes";
import { meta, views } from "../frame";

const { html } = await renderBrief(brief as BriefProps);
const desk = views(html);

export default meta;
export const Light = desk.light;
export const Dark = desk.dark;
export const Inverted = { args: { html: forceInvert(html), width: 600 } };
export const Phone = views(html, 390).light;
