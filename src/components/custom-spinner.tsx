import { cn } from "@/lib/utils";

interface CustomSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CustomSpinner({ 
  text = "Cargando registros...", 
  size = "md",
  className 
}: CustomSpinnerProps) {
  const sizeMap = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center gap-3 h-32 justify-center", className)}>
      <div className={cn("relative", sizeMap[size])}>
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
      {text && (
        <span className="text-base text-slate-400">{text}</span>
      )}
    </div>
  );
}