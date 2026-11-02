import { ObjectionNotice } from "../../../components/ObjectionNotice";
import brief from "../../mails/brief.json";
import { meta, part, views } from "../frame";

const shown = views(await part(<ObjectionNotice {...brief.objection} />));

export default meta;
export const Light = shown.light;
export const Dark = shown.dark;
