import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "rounded-md px-4 py-2 text-sm font-medium transition-colors";
  const variants = {
    primary: "bg-forest text-paper hover:bg-forestSoft",
    ghost: "bg-transparent text-ink hover:bg-ink/5 border border-line",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
