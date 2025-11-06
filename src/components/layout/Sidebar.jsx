"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  FileText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["tecnico", "gestor", "administrador"],
  },
  {
    name: "Ativos",
    href: "/dashboard/assets",
    icon: Package,
    roles: ["tecnico", "gestor", "administrador"],
  },
  {
    name: "DNBs",
    href: "/dashboard/dnbs",
    icon: MapPin,
    roles: ["gestor", "administrador"],
  },
  {
    name: "Usuários",
    href: "/dashboard/users",
    icon: Users,
    roles: ["gestor", "administrador"],
  },
  {
    name: "Auditoria",
    href: "/dashboard/audit",
    icon: FileText,
    roles: ["gestor", "administrador"],
  },
];

export function Sidebar({ user }) {
  const pathname = usePathname();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-4">
        <h1 className="text-2xl font-bold text-white">Assetly</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-800 p-4">
        <div className="mb-2 text-sm text-gray-400">
          <p className="font-medium text-white">{user.name}</p>
          <p className="text-xs capitalize">{user.role}</p>
          {user.dnb && <p className="text-xs text-gray-500">{user.dnb.code}</p>}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
