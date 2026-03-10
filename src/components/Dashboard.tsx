import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/Button";
import { WalletConnect } from "./WalletConnect";
import { ExpenseChart } from "./ExpenseChart";
import { TransactionList } from "./TransactionList";
import { LogOut, BarChart3, Calendar, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";

export function Dashboard() {
  const { signOut } = useAuthActions();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const csvData = useQuery(api.transactions.exportToCSV, {});

  const handleExport = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chainledger-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-fuchsia-600/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  ChainLedger
                </h1>
                <p className="text-xs text-zinc-500 hidden sm:block">
                  Onchain Expense Tracker
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
                <button
                  onClick={() => setPeriod("week")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
                    period === "week"
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Week
                </button>
                <button
                  onClick={() => setPeriod("month")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
                    period === "month"
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  Month
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-zinc-400 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Period:</span>
                <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setPeriod("week");
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                      period === "week"
                        ? "bg-violet-600 text-white"
                        : "text-zinc-400"
                    )}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => {
                      setPeriod("month");
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                      period === "month"
                        ? "bg-violet-600 text-white"
                        : "text-zinc-400"
                    )}
                  >
                    Month
                  </button>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-zinc-400"
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Wallet Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <WalletConnect />
          </div>
          <div className="lg:col-span-2">
            <div className="h-full rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-violet-950/30 via-zinc-900/50 to-fuchsia-950/30 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Welcome to ChainLedger
                  </h2>
                  <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                    AI-powered expense tracking for the onchain economy
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                    Base Network
                  </span>
                  <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium border border-violet-500/30">
                    Real-time Sync
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Features
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-white mt-1">
                    Auto-tag
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Charts
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-white mt-1">
                    Real-time
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Export
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-white mt-1">
                    CSV
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Categories
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-white mt-1">
                    8 Types
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <ExpenseChart period={period} />

        {/* Transactions Section */}
        <TransactionList onExport={handleExport} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-xs text-zinc-600">
            Requested by{" "}
            <a
              href="https://twitter.com/blugati"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              @blugati
            </a>{" "}
            · Built by{" "}
            <a
              href="https://twitter.com/clonkbot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              @clonkbot
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
