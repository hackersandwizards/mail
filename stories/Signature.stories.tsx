import { Signature } from "../components/Signature";
import brief from "../specimen/brief.json";
import { meta, part, views } from "./frame";

const shown = views(await part(<Signature {...brief.signature} />));

export default meta;
export const Light = shown.light;
export const Dark = shown.dark;
