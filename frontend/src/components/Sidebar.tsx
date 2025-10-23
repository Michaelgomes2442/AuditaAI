import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ScrollText, Shield, Settings, Zap, Activity } from "lucide-react";
import { usePathname } from "next/navigation";

const routes = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500"
  },
  {
    label: "Pilot Demo",
    icon: Zap,
    href: "/pilot",
    color: "text-green-500",
    badge: "LIVE"
  },
  {
    label: "Live Application",
    icon: Activity,
    href: "/live-demo",
    color: "text-purple-500",
    badge: "NEW"
  },
  {
    label: "Logs",
    icon: ScrollText,
    href: "/logs",
    color: "text-violet-500"
  },
  {
    label: "Governance",
    icon: Shield,
    href: "/governance",
    color: "text-pink-700"
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500"
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2">
        <Link href="/" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold">
            Audita AI
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
                {route.badge && (
                  <span className="ml-auto text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                    {route.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
