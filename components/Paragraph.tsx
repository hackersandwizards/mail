import type { ReactNode } from "react";
import { Text } from "react-email";

/** Body copy: 16/24 px, the column's ink. Lines of one paragraph are joined by line breaks. */
export function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, lineHeight: "24px", margin: "0 0 16px" }}>{children}</Text>;
}

/** The lines as one paragraph, a line break between each. */
export function Lines({ lines }: { lines: string[] }) {
  return <Paragraph>{lines.flatMap((line, i) => (i ? [<br key={i} />, line] : [line]))}</Paragraph>;
}
