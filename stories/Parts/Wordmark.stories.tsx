import { Wordmark } from "../../components/Wordmark";
import { meta, part, views } from "../frame";

const shown = views(await part(<Wordmark />));

export default meta;
export const Light = shown.light;
export const Dark = shown.dark;
