import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "navy" | "secondary" | "ghost" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  /** Deep agricultural green. The single most important action on a screen. */
  primary: "bg-leaf-700 text-white shadow-soft hover:bg-leaf-800 active:bg-leaf-900",
  /** Navy alternative for analytical / officer contexts. */
  navy: "bg-monsoon-800 text-white shadow-soft hover:bg-monsoon-900 active:bg-monsoon-950",
  /** Outlined: brand text on white. */
  secondary: "border border-line-strong bg-white text-ink shadow-soft hover:border-leaf-400 hover:bg-leaf-50/60",
  /** No chrome until hovered. */
  ghost: "text-body hover:bg-slate-100 hover:text-ink",
  /** Destructive or high-risk. */
  danger: "bg-red-600 text-white shadow-soft hover:bg-red-700 active:bg-red-800",
  /** Tinted, low emphasis. */
  subtle: "bg-leaf-50 text-leaf-800 hover:bg-leaf-100",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 gap-1.5 rounded-control px-2.5 text-[12.5px]",
  md: "min-h-10 gap-2 rounded-control px-3.5 text-[13.5px]",
  lg: "min-h-12 gap-2 rounded-control px-4 text-[15px]",
};

const ICON_SIZE: Record<ButtonSize, string> = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-4.5 w-4.5" };

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className = "") {
  return `inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition disabled:pointer-events-none disabled:opacity-45 ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
}

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  /** Place the icon after the label (e.g. a chevron). */
  iconEnd?: LucideIcon;
  className?: string;
  children?: ReactNode;
}

/** Standard button. Every clickable action in the app should use this. */
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconEnd: IconEnd,
  className = "",
  children,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {Icon && <Icon className={ICON_SIZE[size]} aria-hidden />}
      {children}
      {IconEnd && <IconEnd className={ICON_SIZE[size]} aria-hidden />}
    </button>
  );
}

/** Same visual system, but renders a Next.js link. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconEnd: IconEnd,
  className = "",
  children,
  ...rest
}: Common & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {Icon && <Icon className={ICON_SIZE[size]} aria-hidden />}
      {children}
      {IconEnd && <IconEnd className={ICON_SIZE[size]} aria-hidden />}
    </Link>
  );
}

/** Square icon-only button (close, menu, stepper). Keeps a 40px touch target. */
export function IconButton({
  icon: Icon,
  label,
  size = "md",
  variant = "ghost",
  className = "",
  ...rest
}: { icon: LucideIcon; label: string; size?: ButtonSize; variant?: ButtonVariant; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const box = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid shrink-0 place-items-center rounded-control transition disabled:pointer-events-none disabled:opacity-45 ${box} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      <Icon className={size === "lg" ? "h-5 w-5" : "h-4.5 w-4.5"} aria-hidden />
    </button>
  );
}
