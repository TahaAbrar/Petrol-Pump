import logo from "@/assets/total-logo.png";

export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return <img src={logo} alt="Total Fuel Station" className={className} draggable={false} />;
}
