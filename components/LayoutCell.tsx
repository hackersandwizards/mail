import type { CSSProperties, ReactNode, TdHTMLAttributes } from "react";

type LayoutCellProps = {
  width?: string;
  tableStyle: CSSProperties;
  cell: TdHTMLAttributes<HTMLTableCellElement>;
  children: ReactNode;
};

/** A one-cell presentation table for email layout. */
export function LayoutCell({ width, tableStyle, cell, children }: LayoutCellProps) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      width={width}
      style={tableStyle}
    >
      <tbody>
        <tr>
          <td {...cell}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}
