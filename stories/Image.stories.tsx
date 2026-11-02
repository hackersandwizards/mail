import card from "@hackersandwizards/brand/logos/lockup-compact.png";
import { Image } from "../components/Image";
import { meta, part, views } from "./frame";

const image = { alt: "Vorschaubild zum Artikel", width: 300, height: 152 };
const loaded = views(await part(<Image src={card.src} {...image} />));
// A source that does not load stands in for an image the client blocks.
const blocked = views(
  await part(<Image src="blocked.png" href="https://example.com/" {...image} />),
);

export default meta;
export const Loaded = loaded.light;
export const LoadedDark = loaded.dark;
export const Blocked = blocked.light;
export const BlockedDark = blocked.dark;
