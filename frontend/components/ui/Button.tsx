import { ButtonHTMLAttributes, forwardRef } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet";
  size?: "sm" | "md";
};

const VARIANTES = {
  primary: "bg-ink text-bg hover:bg-ink/85 active:bg-ink/75",
  ghost: "border border-line bg-surface text-ink hover:border-ink/40 hover:bg-bg",
  quiet: "text-muted hover:bg-surface hover:text-ink",
};

const TAMANHOS = {
  sm: "h-8 gap-1.5 px-2.5 text-sm",
  md: "h-10 gap-2 px-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANTES[variant]} ${TAMANHOS[size]} ${className}`}
      {...props}
    />
  );
});
