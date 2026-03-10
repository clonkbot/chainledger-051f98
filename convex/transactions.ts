import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Category detection based on transaction patterns
function categorizeTransaction(tx: {
  to: string;
  from: string;
  value: string;
  input?: string;
  walletAddress: string;
}): { category: string; aiTags: string[]; description: string } {
  const toAddr = tx.to?.toLowerCase() || "";
  const fromAddr = tx.from?.toLowerCase() || "";
  const walletAddr = tx.walletAddress.toLowerCase();
  const value = BigInt(tx.value || "0");

  // Known contract addresses (simplified for demo)
  const knownContracts: Record<string, { category: string; name: string }> = {
    "0x4200000000000000000000000000000000000006": { category: "swap", name: "WETH" },
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { category: "swap", name: "USDC" },
    "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": { category: "swap", name: "cbETH" },
    "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": { category: "swap", name: "Uniswap" },
    "0x6b175474e89094c44da98b954eedeac495271d0f": { category: "swap", name: "DAI" },
  };

  const aiTags: string[] = [];
  let category = "other";
  let description = "Transaction";

  // Check if it's a known contract interaction
  if (knownContracts[toAddr]) {
    const contract = knownContracts[toAddr];
    category = contract.category;
    aiTags.push(contract.name);
    description = `${contract.name} interaction`;
  }

  // Detect transfers
  if (value > 0n) {
    if (fromAddr === walletAddr) {
      category = "transfer_out";
      description = "ETH sent";
      aiTags.push("outgoing");
    } else if (toAddr === walletAddr) {
      category = "transfer_in";
      description = "ETH received";
      aiTags.push("incoming");
    }
  }

  // Gas-only transaction detection
  if (value === 0n && fromAddr === walletAddr) {
    category = "contract";
    description = "Contract interaction";
    aiTags.push("smart-contract");
  }

  // Bridge detection (simplified)
  const bridgeKeywords = ["bridge", "hop", "stargate", "across", "synapse"];
  if (bridgeKeywords.some((k) => toAddr.includes(k))) {
    category = "bridge";
    description = "Bridge transaction";
    aiTags.push("cross-chain");
  }

  // NFT detection (simplified - check for common marketplaces)
  const nftMarkets = [
    "0x00000000000000adc04c56bf30ac9d3c0aaf14dc", // Seaport
    "0x0000000000e655fae4d56241588680f86e3b2377", // OpenSea
  ];
  if (nftMarkets.includes(toAddr)) {
    category = fromAddr === walletAddr ? "nft_buy" : "nft_sell";
    description = fromAddr === walletAddr ? "NFT purchase" : "NFT sale";
    aiTags.push("NFT", "collectible");
  }

  // Add general tags
  if (value > 0n) {
    const ethValue = Number(value) / 1e18;
    if (ethValue > 1) aiTags.push("large-tx");
    if (ethValue < 0.01) aiTags.push("micro-tx");
  }

  return { category, aiTags, description };
}

export const list = query({
  args: {
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let txQuery = ctx.db
      .query("transactions")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId))
      .order("desc");

    const transactions = await txQuery.collect();

    let filtered = transactions;

    if (args.startDate) {
      filtered = filtered.filter((tx) => tx.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((tx) => tx.timestamp <= args.endDate!);
    }
    if (args.category && args.category !== "all") {
      filtered = filtered.filter((tx) => tx.category === args.category);
    }

    return filtered.slice(0, args.limit || 100);
  },
});

export const getStats = query({
  args: {
    period: v.string(), // "week" or "month"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const now = Date.now();
    const periodMs =
      args.period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const startDate = now - periodMs;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId))
      .collect();

    const periodTxs = transactions.filter((tx) => tx.timestamp >= startDate);

    // Calculate stats
    const categoryBreakdown: Record<string, { count: number; gasSpent: number }> = {};
    let totalGasSpent = 0;
    let totalValue = 0;

    for (const tx of periodTxs) {
      const gasCost =
        (Number(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)) / 1e18) * 2500; // Rough ETH->USD
      totalGasSpent += gasCost;
      totalValue += tx.usdValue || 0;

      if (!categoryBreakdown[tx.category]) {
        categoryBreakdown[tx.category] = { count: 0, gasSpent: 0 };
      }
      categoryBreakdown[tx.category].count++;
      categoryBreakdown[tx.category].gasSpent += gasCost;
    }

    // Generate chart data by day
    const chartData: { date: string; gas: number; value: number; count: number }[] = [];
    const days = args.period === "week" ? 7 : 30;

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000;
      const dayEnd = now - i * 24 * 60 * 60 * 1000;
      const dayTxs = periodTxs.filter(
        (tx) => tx.timestamp >= dayStart && tx.timestamp < dayEnd
      );

      const dayGas = dayTxs.reduce((sum, tx) => {
        return (
          sum + (Number(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)) / 1e18) * 2500
        );
      }, 0);

      const dayValue = dayTxs.reduce((sum, tx) => sum + (tx.usdValue || 0), 0);

      const date = new Date(dayStart);
      chartData.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        gas: Math.round(dayGas * 100) / 100,
        value: Math.round(dayValue * 100) / 100,
        count: dayTxs.length,
      });
    }

    return {
      totalTransactions: periodTxs.length,
      totalGasSpent: Math.round(totalGasSpent * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      categoryBreakdown,
      chartData,
    };
  },
});

export const addTransaction = mutation({
  args: {
    walletAddress: v.string(),
    hash: v.string(),
    blockNumber: v.number(),
    timestamp: v.number(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    gasUsed: v.string(),
    gasPrice: v.string(),
    usdValue: v.optional(v.number()),
    tokenSymbol: v.optional(v.string()),
    nftName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if transaction already exists
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .first();

    if (existing) {
      return existing._id;
    }

    // Auto-categorize
    const { category, aiTags, description } = categorizeTransaction({
      to: args.to,
      from: args.from,
      value: args.value,
      walletAddress: args.walletAddress,
    });

    return await ctx.db.insert("transactions", {
      userId,
      walletAddress: args.walletAddress.toLowerCase(),
      hash: args.hash,
      blockNumber: args.blockNumber,
      timestamp: args.timestamp,
      from: args.from.toLowerCase(),
      to: args.to.toLowerCase(),
      value: args.value,
      gasUsed: args.gasUsed,
      gasPrice: args.gasPrice,
      category,
      aiTags,
      description,
      usdValue: args.usdValue,
      tokenSymbol: args.tokenSymbol,
      nftName: args.nftName,
      createdAt: Date.now(),
    });
  },
});

export const updateCategory = mutation({
  args: {
    transactionId: v.id("transactions"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tx = await ctx.db.get(args.transactionId);
    if (!tx || tx.userId !== userId) {
      throw new Error("Transaction not found");
    }

    await ctx.db.patch(args.transactionId, {
      category: args.category,
    });
  },
});

export const exportToCSV = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return "";

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    let filtered = transactions;
    if (args.startDate) {
      filtered = filtered.filter((tx) => tx.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((tx) => tx.timestamp <= args.endDate!);
    }

    const headers = [
      "Date",
      "Hash",
      "Category",
      "Description",
      "From",
      "To",
      "Value (ETH)",
      "Gas Used",
      "Gas Price (Gwei)",
      "USD Value",
      "Tags",
    ];

    const rows = filtered.map((tx) => [
      new Date(tx.timestamp).toISOString(),
      tx.hash,
      tx.category,
      tx.description,
      tx.from,
      tx.to,
      (Number(tx.value) / 1e18).toFixed(6),
      tx.gasUsed,
      (Number(tx.gasPrice) / 1e9).toFixed(2),
      tx.usdValue?.toFixed(2) || "0",
      tx.aiTags.join("; "),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  },
});

// Action to fetch transactions from blockchain (simulated)
export const fetchFromBlockchain = action({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    // In production, this would call Basescan API or similar
    // For demo, we'll generate some sample transactions
    const sampleTxs = [
      {
        hash: `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`,
        blockNumber: 10000000 + Math.floor(Math.random() * 1000000),
        timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        from: args.walletAddress,
        to: "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
        value: Math.floor(Math.random() * 1e17).toString(),
        gasUsed: (21000 + Math.floor(Math.random() * 100000)).toString(),
        gasPrice: (1e9 + Math.floor(Math.random() * 1e8)).toString(),
        usdValue: Math.random() * 500,
      },
      {
        hash: `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`,
        blockNumber: 10000000 + Math.floor(Math.random() * 1000000),
        timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        from: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        to: args.walletAddress,
        value: Math.floor(Math.random() * 1e17).toString(),
        gasUsed: (21000 + Math.floor(Math.random() * 100000)).toString(),
        gasPrice: (1e9 + Math.floor(Math.random() * 1e8)).toString(),
        usdValue: Math.random() * 200,
      },
      {
        hash: `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`,
        blockNumber: 10000000 + Math.floor(Math.random() * 1000000),
        timestamp: Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000),
        from: args.walletAddress,
        to: "0x00000000000000adc04c56bf30ac9d3c0aaf14dc",
        value: Math.floor(Math.random() * 5e16).toString(),
        gasUsed: (150000 + Math.floor(Math.random() * 100000)).toString(),
        gasPrice: (1e9 + Math.floor(Math.random() * 1e8)).toString(),
        usdValue: Math.random() * 1000,
      },
    ];

    for (const tx of sampleTxs) {
      await ctx.runMutation(api.transactions.addTransaction, {
        walletAddress: args.walletAddress,
        ...tx,
      });
    }

    return { fetched: sampleTxs.length };
  },
});
