import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { TABLE, TABLE_FRAME, THEAD, TH, TD } from "@/lib/ui";

/**
 * Consistent chrome for every data table: horizontal scroll on small screens,
 * card border, sticky-free simple header.
 */
export function TableFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${TABLE_FRAME} ${className}`}>{children}</div>;
}

export function Table({ children, caption, minWidth }: { children: ReactNode; caption: string; minWidth?: string }) {
  return (
    <table className={TABLE} style={minWidth ? { minWidth } : undefined}>
      <caption className="sr-only">{caption}</caption>
      {children}
    </table>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className={THEAD}>{children}</thead>;
}

export function Th({ className = "", numeric = false, children, ...rest }: { numeric?: boolean } & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={`${TH} ${numeric ? "text-right" : "text-left"} ${className}`} {...rest}>
      {children}
    </th>
  );
}

/** Row header cell (first column), styled as emphasised body text. */
export function RowTh({ className = "", children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="row" className={`px-3 py-2.5 text-left align-middle font-semibold text-ink ${className}`} {...rest}>
      {children}
    </th>
  );
}

export function Td({ className = "", numeric = false, children, ...rest }: { numeric?: boolean } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`${TD} ${numeric ? "text-right tabular-nums" : ""} ${className}`} {...rest}>
      {children}
    </td>
  );
}
