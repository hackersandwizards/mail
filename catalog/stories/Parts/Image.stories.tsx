import card from "@hackersandwizards/brand/logos/icon-maskable-512.png";
import { Image } from "../../../components/Image";
import { meta, part, views } from "../frame";
import data from "../../mails/brief-bild.json";

const picture = data.items[0].image;
if (!picture) {
  throw new Error("Image.stories: catalog/mails/brief-bild.json items[0] has no image");
}
const { alt, width, height } = picture;
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
