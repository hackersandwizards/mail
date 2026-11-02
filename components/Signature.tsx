import {
  fillSignature,
  type SignatureFields,
} from "@hackersandwizards/brand/mail-signature/fill.ts";
import { signatureTemplate } from "./theme";

export type { SignatureFields };

/** The brand's mail signature, filled from its template, never a copy of it. */
export function Signature(fields: SignatureFields) {
  return (
    <div
      className="hw-sig"
      style={{ marginTop: 24 }}
      dangerouslySetInnerHTML={{ __html: fillSignature(signatureTemplate.html, fields, "html") }}
    />
  );
}

/** The signature's plain-text form, for the text part. */
export const signatureText = (fields: SignatureFields) =>
  fillSignature(signatureTemplate.text, fields, "text");
