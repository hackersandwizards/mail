import type { ReactNode } from "react";
import { Text } from "react-email";

/** Body copy in the column's ink. */
export function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, lineHeight: "24px", margin: "0 0 16px" }}>{children}</Text>;
}

/** The lines as one paragraph, a line break between each. */
export function Lines({ lines }: { lines: string[] }) {
  return <Paragraph>{lines.flatMap((line, i) => (i ? [<br key={i} />, line] : [line]))}</Paragraph>;
}
