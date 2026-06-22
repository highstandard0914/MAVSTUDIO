import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface-800 border border-white/10 rounded-2xl",
        glow && "shadow-lg shadow-brand-500/10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-5 border-b border-white/10", className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = "brand",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color?: "brand" | "green" | "blue" | "orange" | "red";
}) {
  const colors = {
    brand: "text-brand-400 bg-brand-500/10 border-brand-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl border", colors[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
