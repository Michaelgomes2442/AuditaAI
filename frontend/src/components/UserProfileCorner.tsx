"use client";

import { useSession } from "next-auth/react";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { User, Crown, Zap, Loader2 } from "lucide-react";
import { useState } from "react";

export default function UserProfileCorner() {
  const { data: session } = useSession();
  const { profile, isLoading, isFree, isPaid, isArchitect } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);

  // Don't render anything if not authenticated
  if (!session) {
    return null;
  }

  // Get tier color and icon
  const getTierStyles = () => {
    if (isArchitect) {
      return {
        bg: "from-purple-500/20 to-pink-500/20",
        border: "border-purple-500/40",
        text: "text-purple-300",
        icon: <Crown className="h-3 w-3" />,
        label: "ARCHITECT"
      };
    }
    if (isPaid) {
      return {
        bg: "from-cyan-500/20 to-blue-500/20",
        border: "border-cyan-500/40",
        text: "text-cyan-300",
        icon: <Zap className="h-3 w-3" />,
        label: "PAID"
      };
    }
    return {
      bg: "from-slate-500/20 to-slate-600/20",
      border: "border-slate-500/40",
      text: "text-slate-300",
      icon: <User className="h-3 w-3" />,
      label: "FREE"
    };
  };

  const tierStyles = getTierStyles();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className="relative"
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        {/* Profile Badge */}
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-gradient-to-r ${tierStyles.bg}
          border ${tierStyles.border}
          backdrop-blur-sm
          hover:scale-105 transition-all duration-200
          cursor-pointer
          shadow-lg
        `}>
          {/* Avatar/Icon */}
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-800/50 border border-white/10">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <User className="h-4 w-4 text-slate-300" />
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col min-w-[120px]">
            <span className="text-xs font-mono text-slate-200 truncate max-w-[140px]">
              {profile?.email || session.user?.email || "Loading..."}
            </span>
            <div className={`flex items-center gap-1 ${tierStyles.text}`}>
              {tierStyles.icon}
              <span className="text-[10px] font-mono font-bold">
                {tierStyles.label}
              </span>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 rounded-lg bg-slate-800/95 border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="p-2 space-y-1">
              <Link href="/profile">
                <div className="px-3 py-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-mono text-slate-300 hover:text-white">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/pilot">
                <div className="px-3 py-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-mono text-slate-300 hover:text-white">
                    <Zap className="h-4 w-4" />
                    <span>Pilot Dashboard</span>
                  </div>
                </div>
              </Link>

              {isFree && (
                <Link href="/profile">
                  <div className="px-3 py-2 rounded-md hover:bg-cyan-500/10 transition-colors cursor-pointer border-t border-white/5 mt-1 pt-2">
                    <div className="flex items-center gap-2 text-sm font-mono text-cyan-400 hover:text-cyan-300">
                      <Crown className="h-4 w-4" />
                      <span>Upgrade Plan</span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
