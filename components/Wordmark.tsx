import { Section, Text } from "react-email";
import { paint } from "./MailShell";
import { fonts, palette } from "./theme";

/** The wordmark as text in the brand's mail monospace, never an image, under a rule. */
export function Wordmark() {
  return (
    <Section
      className={paint.border("rule")}
      style={{ borderBottom: `1px solid ${palette.light.rule}`, marginBottom: 24 }}
    >
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 16,
          lineHeight: "24px",
          fontWeight: "bold",
          margin: "0 0 16px",
        }}
      >
        <span className={paint.text("accent")} style={{ color: palette.light.accent }}>
          hackers
        </span>
        <span className={paint.text("ampersand")} style={{ color: palette.light.ampersand }}>
          &amp;
        </span>
        <span className={paint.text("label")} style={{ color: palette.light.label }}>
          wizards
        </span>
      </Text>
    </Section>
  );
}
