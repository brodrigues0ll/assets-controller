"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { getAssetCounts } from "@/lib/actions/assets";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  FileText,
  LogOut,
  ScanLine,
  Tag,
  Shield,
  ChevronRight,
  Cpu,
  Factory,
  Building2,
  MapPinOff,
  Trash2,
  FileWarning,
  FileUp,
  ClipboardList,
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
    name: "Scanner",
    href: "/scan",
    icon: ScanLine,
    roles: ["tecnico", "gestor", "administrador"],
  },
  {
    name: "DNBs",
    href: "/dashboard/dnbs",
    icon: MapPin,
    roles: ["gestor", "administrador"],
  },
  {
    name: "Categorias",
    href: "/dashboard/categorias",
    icon: Tag,
    roles: ["gestor", "administrador"],
  },
  {
    name: "Fabricantes",
    href: "/dashboard/fabricantes",
    icon: Factory,
    roles: ["gestor", "administrador"],
  },
  {
    name: "Prédios",
    href: "/dashboard/predios",
    icon: Building2,
    roles: ["gestor", "administrador"],
  },
  {
    name: "Setores",
    href: "/dashboard/setores",
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
    name: "Grupos",
    href: "/dashboard/grupos",
    icon: Shield,
    roles: ["administrador"],
  },
  {
    name: "Auditoria",
    href: "/dashboard/audit",
    icon: FileText,
    roles: ["gestor", "administrador"],
  },
];

const roleLabels = {
  tecnico: "TEC",
  gestor: "GST",
  administrador: "ADM",
};

const roleColors = {
  tecnico: "text-cyber-cyan",
  gestor: "text-cyber-green",
  administrador: "text-cyber-purple",
};

export function Sidebar({ user }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ naoLocalizados: 0, inservíveis: 0, descricaoIncompleta: 0 });

  useEffect(() => {
    getAssetCounts().then(setCounts).catch(() => {});
  }, []);

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const patrimonialLinks = [
    { name: "Não Localizados", href: "/dashboard/nao-localizados", icon: MapPinOff, count: counts.naoLocalizados, color: "#ff2d55" },
    { name: "Alienação", href: "/dashboard/alienacao", icon: Trash2, count: counts.inservíveis, color: "#fbbf24" },
    { name: "Desc. Incompleta", href: "/dashboard/descricao-incompleta", icon: FileWarning, count: counts.descricaoIncompleta, color: "#fbbf24" },
    { name: "Importar Planilha", href: "/dashboard/importar", icon: FileUp, count: 0, color: "#a855f7" },
    { name: "Inventário", href: "/dashboard/inventario", icon: ClipboardList, count: 0, color: "#00d4ff" },
  ];

  return (
    <div
      className="flex h-full w-64 flex-col"
      style={{
        background: "#0a0a0f",
        borderRight: "1px solid #1a3a4a",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center gap-3 px-5"
        style={{ borderBottom: "1px solid #1a3a4a" }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded"
          style={{
            background: "#00d4ff15",
            border: "1px solid #00d4ff40",
          }}
        >
          <Cpu className="h-4 w-4" style={{ color: "#00d4ff" }} />
        </div>
        <div>
          <h1
            className="text-base font-bold tracking-widest font-mono"
            style={{
              color: "#00d4ff",
              textShadow: "0 0 10px #00d4ff60",
            }}
          >
            INFRALEDGER
          </h1>
          <p className="text-xs font-mono" style={{ color: "#1a3a4a" }}>
            v1.0 // SISTEMA
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p
          className="text-xs font-mono uppercase tracking-widest px-3 pb-2 mb-1"
          style={{ color: "#1a3a4a", borderBottom: "1px solid #1a3a4a10" }}
        >
          Navegação
        </p>
        {filteredNavigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-all duration-150 group relative",
                active
                  ? "border-l-2"
                  : "border-l-2 border-transparent"
              )}
              style={
                active
                  ? {
                      background: "#00d4ff0f",
                      borderLeftColor: "#00d4ff",
                      color: "#00d4ff",
                    }
                  : {
                      color: "#64748b",
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "#00d4ff08";
                  e.currentTarget.style.color = "#94a3b8";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              <item.icon
                className="h-4 w-4 flex-shrink-0"
                style={active ? { color: "#00d4ff" } : {}}
              />
              <span className={active ? "font-semibold" : ""}>{item.name}</span>
              {active && (
                <ChevronRight
                  className="h-3 w-3 ml-auto"
                  style={{ color: "#00d4ff60" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Gestão Patrimonial */}
      {(user.role === "gestor" || user.role === "administrador") && (
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid #1a3a4a30" }}>
          <p className="text-xs font-mono uppercase tracking-widest px-3 pb-2 mb-1" style={{ color: "#1a3a4a", borderBottom: "1px solid #1a3a4a10" }}>
            Gestão Patrimonial
          </p>
          {patrimonialLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}
                className={cn("flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-all duration-150 border-l-2", active ? "" : "border-transparent")}
                style={active ? { background: "#00d4ff0f", borderLeftColor: "#00d4ff", color: "#00d4ff" } : { color: "#64748b" }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#00d4ff08"; e.currentTarget.style.color = "#94a3b8"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}>
                <item.icon className="h-4 w-4 flex-shrink-0" style={active ? { color: "#00d4ff" } : {}} />
                <span className={cn("flex-1", active ? "font-semibold" : "")}>{item.name}</span>
                {item.count > 0 && (
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* User Info */}
      <div
        className="p-4"
        style={{ borderTop: "1px solid #1a3a4a" }}
      >
        <div
          className="flex items-center gap-3 p-3 rounded mb-3"
          style={{
            background: "#0f0f1a",
            border: "1px solid #1a3a4a",
          }}
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 font-mono font-bold text-xs"
            style={{
              background: "#00d4ff15",
              border: "1px solid #00d4ff30",
              color: "#00d4ff",
            }}
          >
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p
              className="font-medium text-sm truncate"
              style={{ color: "#e2e8f0" }}
            >
              {user.name}
            </p>
            <p
              className="text-xs font-mono"
              style={{ color: roleColors[user.role] ? "#00d4ff" : "#64748b" }}
            >
              [{roleLabels[user.role] || user.role}]
              {user.dnb && (
                <span style={{ color: "#64748b" }}> // {user.dnb.code}</span>
              )}
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm transition-all duration-150"
          style={{ color: "#64748b" }}
          onClick={() => signOut({ callbackUrl: "/login" })}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ff2d5510";
            e.currentTarget.style.color = "#ff2d55";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <LogOut className="h-4 w-4" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}
