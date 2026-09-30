import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { INPUT, INPUT_LG, LABEL, MUTED } from "@/lib/ui";

/**
 * Label + control + optional hint, with the label correctly associated.
 * Every form on the site uses this so spacing and type never drift.
 */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className = "",
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={LABEL}>
          {label}
        </label>
      ) : (
        <span className={LABEL}>{label}</span>
      )}
      {children}
      {hint && <p className={`mt-1 ${MUTED}`}>{hint}</p>}
    </div>
  );
}

/** Text input with the shared control metrics. `big` for farmer screens. */
export function Input({ big = false, className = "", ...rest }: { big?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${big ? INPUT_LG : INPUT} ${className}`} {...rest} />;
}

/** Native select with the shared control metrics (caret comes from globals.css). */
export function Select({ big = false, className = "", children, ...rest }: { big?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${big ? INPUT_LG : INPUT} ${className}`} {...rest}>
      {children}
    </select>
  );
}
