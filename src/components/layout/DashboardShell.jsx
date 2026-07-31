"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Menu, X, ScanLine } from "lucide-react";
import Link from "next/link";

export function DashboardShell({ user, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0a0a0f" }}
    >
      {/* Sidebar - desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute inset-0"
            style={{ background: "#0a0a0f90" }}
          />
          <div
            className="relative flex flex-col w-64 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar user={user} />
          </div>
          <button
            className="absolute top-4 right-4 z-20 p-2 rounded"
            style={{
              background: "#0f0f1a",
              border: "1px solid #1a3a4a",
              color: "#00d4ff",
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div
          className="flex md:hidden items-center justify-between px-4 h-14 flex-shrink-0"
          style={{
            background: "#0f0f1a",
            borderBottom: "1px solid #1a3a4a",
          }}
        >
          <button
            className="p-2 rounded"
            style={{
              background: "#0a0a0f",
              border: "1px solid #1a3a4a",
              color: "#00d4ff",
            }}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span
            className="font-mono font-bold tracking-widest text-sm"
            style={{ color: "#00d4ff" }}
          >
            INFRALEDGER
          </span>
          <div style={{ width: "36px" }} />
        </div>

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ background: "#0a0a0f" }}
        >
          {children}
        </main>
      </div>

      {/* Mobile floating scanner button */}
      <Link
        href="/scan"
        className="fixed bottom-6 right-6 z-40 flex md:hidden items-center justify-center w-14 h-14 rounded-full transition-all duration-150"
        style={{
          background: "#00d4ff",
          color: "#0a0a0f",
          boxShadow: "0 0 20px rgba(0,212,255,0.5)",
        }}
      >
        <ScanLine className="h-6 w-6" />
      </Link>
    </div>
  );
}
