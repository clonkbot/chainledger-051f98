import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Connected wallets for users
  wallets: defineTable({
    userId: v.id("users"),
    address: v.string(),
    chainId: v.number(),
    connectedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_address", ["address"]),

  // Transactions fetched and processed
  transactions: defineTable({
    userId: v.id("users"),
    walletAddress: v.string(),
    hash: v.string(),
    blockNumber: v.number(),
    timestamp: v.number(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    gasUsed: v.string(),
    gasPrice: v.string(),
    // AI-categorized fields
    category: v.string(), // "swap", "bridge", "nft_buy", "nft_sell", "gas", "transfer_in", "transfer_out", "contract", "other"
    aiTags: v.array(v.string()),
    description: v.string(),
    usdValue: v.optional(v.number()),
    tokenSymbol: v.optional(v.string()),
    nftName: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"])
    .index("by_hash", ["hash"])
    .index("by_wallet", ["walletAddress"]),

  // Expense summaries (weekly/monthly aggregates)
  summaries: defineTable({
    userId: v.id("users"),
    period: v.string(), // "week" or "month"
    periodStart: v.number(),
    periodEnd: v.number(),
    totalSpent: v.number(),
    totalReceived: v.number(),
    gasSpent: v.number(),
    categoryBreakdown: v.string(), // JSON stringified object
    tagBreakdown: v.string(), // JSON stringified object
    transactionCount: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_period", ["userId", "period", "periodStart"]),
});
