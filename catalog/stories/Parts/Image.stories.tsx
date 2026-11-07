import card from "@hackersandwizards/brand/logos/icon-maskable-512.png";
import { Image } from "../../../components/Image";
import { meta, part, views } from "../frame";
import data from "../../mails/brief-bild.json";

// The picture of the Brief's first item, at its size and with its alt text.
const { alt, width, height } = data.items[0].image!;
const image = { alt, width, height };
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
