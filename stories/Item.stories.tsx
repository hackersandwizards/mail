import { Item } from "../components/Item";
import brief from "../specimen/brief.json";
import { meta, part, views } from "./frame";

const shown = views(await part(<Item {...brief.items[0]} />));

export default meta;
export const Light = shown.light;
export const Dark = shown.dark;
