import type { ReactNode } from "react";
import { Text } from "react-email";

/** Body copy in the column's ink. */
export function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, lineHeight: "24px", margin: "0 0 16px" }}>{children}</Text>;
}

/** Every kind of line break a data string may hold; the text part writes each as `\n`. */
export const BREAK = /\r\n|[\n\v\f\r\u0085\u2028\u2029]/;

/** The string with each line break as a `<br>`, where HTML would fold it into a space. */
export const broken = (text: string): ReactNode[] =>
  text.split(BREAK).flatMap((line, i) => (i ? [<br key={i} />, line] : [line]));

/** The lines as one paragraph, a line break between each. */
export function Lines({ lines }: { lines: string[] }) {
  return <Paragraph>{broken(lines.join("\n"))}</Paragraph>;
}
