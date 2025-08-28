import { cn } from "@/lib/utils";

interface CLCCoinProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "glow" | "premium" | "loading";
  className?: string;
}

const sizeMap = {
  xs: "w-5 h-5",
  sm: "w-8 h-8", 
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
  "2xl": "w-24 h-24"
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
      "drop-shadow-bitcoin": variant === "glow" || variant === "premium",
    },
    className
  );

  const coinClasses = cn(
    "w-full h-full rounded-full border-4 flex items-center justify-center font-bold relative overflow-hidden transition-all duration-300",
    {
      "bg-gradient-bitcoin border-bitcoin-dark/40 text-white shadow-bitcoin": variant === "default",
      "bg-gradient-bitcoin border-bitcoin-dark/60 text-white shadow-bitcoin animate-pulse": variant === "premium",
      "bg-gradient-bitcoin border-bitcoin-dark/50 text-white shadow-bitcoin": variant === "glow",
      "bg-gradient-bitcoin border-bitcoin-dark/30 text-white shadow-bitcoin": variant === "loading"
    }
  );

  const textSize = {
    xs: "text-[7px]",
    sm: "text-[9px]", 
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
    "2xl": "text-lg"
  }[size];

  const innerRingSize = {
    xs: "inset-0.5",
    sm: "inset-1", 
    md: "inset-1.5",
    lg: "inset-2",
    xl: "inset-2.5",
    "2xl": "inset-3"
  }[size];

  return (
    <div className={baseClasses}>
      <div className={coinClasses}>
        {/* Outer metallic ring */}
        <div className="absolute inset-0 rounded-full border-2 border-bitcoin-light/20" />
        
        {/* Main coin surface with Bitcoin gradient */}
        <div className="absolute inset-1 rounded-full bg-gradient-bitcoin-inner shadow-bitcoin-inner" />
        
        {/* Inner highlight ring */}
        <div className={cn("absolute rounded-full border border-white/30", innerRingSize)} />
        
        {/* Reflection effect - top highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent rounded-full" />
        
        {/* Bottom shadow for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-bitcoin-dark/20 via-transparent to-transparent rounded-full" />
        
        {/* CLC Text with Bitcoin styling */}
        <span className={cn("relative z-10 font-heading font-black tracking-wider drop-shadow-sm", textSize)}>
          CLC
        </span>
        
        {/* Bitcoin-style edge ribbing effect */}
        <div className="absolute inset-0 rounded-full" 
             style={{
               background: `radial-gradient(circle at center, transparent 70%, 
                          hsl(var(--bitcoin-dark) / 0.3) 70.5%, 
                          transparent 71%, 
                          hsl(var(--bitcoin-dark) / 0.2) 71.5%, 
                          transparent 72%)`
             }} />
        
        {/* Premium sparkle effects */}
        {(variant === "premium" || variant === "glow") && (
          <>
            <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-ping opacity-75" />
            <div className="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white rounded-full animate-ping opacity-60" 
                 style={{ animationDelay: "0.7s" }} />
            <div className="absolute top-1/2 right-1 w-0.5 h-0.5 bg-bitcoin-light rounded-full animate-pulse" 
                 style={{ animationDelay: "1.2s" }} />
          </>
        )}
      </div>
    </div>
  );
};