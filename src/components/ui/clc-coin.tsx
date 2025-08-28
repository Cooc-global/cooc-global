import { cn } from "@/lib/utils";

interface CLCCoinProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "glow" | "premium" | "loading";
  className?: string;
}

const sizeMap = {
  xs: "w-4 h-4",
  sm: "w-6 h-6", 
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
  "2xl": "w-20 h-20"
};

export const CLCCoin = ({ 
  size = "md", 
  variant = "default", 
  className 
}: CLCCoinProps) => {
  const baseClasses = cn(
    "relative inline-flex items-center justify-center",
    sizeMap[size],
    {
      "animate-spin": variant === "loading",
      "drop-shadow-glow": variant === "glow",
      "drop-shadow-gold-glow animate-pulse": variant === "premium"
    },
    className
  );

  const coinClasses = cn(
    "w-full h-full rounded-full border-2 flex items-center justify-center font-bold relative overflow-hidden",
    {
      "bg-gradient-crypto border-crypto-purple/30 text-foreground shadow-glow": variant === "default",
      "bg-gradient-gold border-gold/50 text-gold-foreground shadow-gold-glow": variant === "premium",
      "bg-gradient-crypto border-crypto-purple/50 text-foreground shadow-glow animate-pulse": variant === "glow",
      "bg-gradient-primary border-primary/30": variant === "loading"
    }
  );

  const textSize = {
    xs: "text-[6px]",
    sm: "text-[8px]", 
    md: "text-[10px]",
    lg: "text-sm",
    xl: "text-base",
    "2xl": "text-lg"
  }[size];

  return (
    <div className={baseClasses}>
      <div className={coinClasses}>
        {/* Coin reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-full" />
        
        {/* Inner ring */}
        <div className="absolute inset-1 rounded-full border border-white/10" />
        
        {/* CLC Text */}
        <span className={cn("relative z-10 font-heading font-black tracking-wider", textSize)}>
          CLC
        </span>
        
        {/* Premium sparkle effect */}
        {variant === "premium" && (
          <>
            <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full animate-ping" />
            <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-white rounded-full animate-ping" 
                 style={{ animationDelay: "0.5s" }} />
          </>
        )}
      </div>
    </div>
  );
};