import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import {
  formatAddress,
  formatEth,
  formatDate,
  formatTime,
  formatUSD,
  categoryColors,
  categoryLabels,
  cn,
} from "../lib/utils";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  ChevronDown,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";

const CATEGORIES = [
  "all",
  "swap",
  "bridge",
  "nft_buy",
  "nft_sell",
  "transfer_in",
  "transfer_out",
  "contract",
  "other",
];

interface Transaction {
  _id: string;
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  category: string;
  description: string;
  aiTags: string[];
  usdValue?: number;
}

interface TransactionListProps {
  onExport: () => void;
}

export function TransactionList({ onExport }: TransactionListProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const transactions = useQuery(api.transactions.list, {
    limit: 50,
    category: selectedCategory,
  });
  const updateCategory = useMutation(api.transactions.updateCategory);

  if (transactions === undefined) {
    return (
      <Card className="border-zinc-800/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  <div className="h-3 bg-zinc-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800/50">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-zinc-800" : ""}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showFilters && (
          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                )}
              >
                {cat === "all" ? "All" : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800/50 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400">No transactions found</p>
            <p className="text-zinc-500 text-sm">
              {selectedCategory !== "all"
                ? "Try a different filter"
                : "Connect a wallet and sync to see transactions"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: Transaction) => {
              const isExpanded = expandedTx === tx._id;
              const isOutgoing =
                tx.category === "transfer_out" ||
                tx.category === "nft_buy" ||
                tx.category === "swap";

              return (
                <div
                  key={tx._id}
                  className="rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedTx(isExpanded ? null : tx._id)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        isOutgoing
                          ? "bg-red-500/20 text-red-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {isOutgoing ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white truncate">
                          {tx.description}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs border",
                            categoryColors[tx.category] || categoryColors.other
                          )}
                        >
                          {categoryLabels[tx.category] || tx.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                        <span>{formatDate(tx.timestamp)}</span>
                        <span>·</span>
                        <span>{formatTime(tx.timestamp)}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p
                        className={cn(
                          "font-mono font-medium",
                          isOutgoing ? "text-red-400" : "text-emerald-400"
                        )}
                      >
                        {isOutgoing ? "-" : "+"}
                        {formatEth(tx.value)} ETH
                      </p>
                      {tx.usdValue && (
                        <p className="text-xs text-zinc-500">
                          {formatUSD(tx.usdValue)}
                        </p>
                      )}
                    </div>

                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-zinc-500 transition-transform flex-shrink-0",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-zinc-700/50 mt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide">
                              Transaction Hash
                            </p>
                            <a
                              href={`https://basescan.org/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 font-mono"
                            >
                              {formatAddress(tx.hash)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide">
                              From
                            </p>
                            <p className="text-sm text-zinc-300 font-mono">
                              {formatAddress(tx.from)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide">
                              To
                            </p>
                            <p className="text-sm text-zinc-300 font-mono">
                              {formatAddress(tx.to)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide">
                              Gas Used
                            </p>
                            <p className="text-sm text-zinc-300">
                              {Number(tx.gasUsed).toLocaleString()} ·{" "}
                              {(Number(tx.gasPrice) / 1e9).toFixed(2)} Gwei
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide">
                              AI Tags
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tx.aiTags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full bg-zinc-700/50 text-xs text-zinc-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
                              Re-categorize
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {CATEGORIES.filter((c) => c !== "all").map(
                                (cat) => (
                                  <button
                                    key={cat}
                                    onClick={() =>
                                      updateCategory({
                                        transactionId: tx._id,
                                        category: cat,
                                      })
                                    }
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs transition-all",
                                      tx.category === cat
                                        ? "bg-violet-600 text-white"
                                        : "bg-zinc-700/50 text-zinc-400 hover:text-white"
                                    )}
                                  >
                                    {categoryLabels[cat]}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
