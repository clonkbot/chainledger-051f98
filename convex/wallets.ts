import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const connect = mutation({
  args: { address: v.string(), chainId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if wallet already connected
    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_address", (q) => q.eq("address", args.address.toLowerCase()))
      .first();

    if (existing && existing.userId === userId) {
      return existing._id;
    }

    if (existing) {
      throw new Error("Wallet already connected to another account");
    }

    return await ctx.db.insert("wallets", {
      userId,
      address: args.address.toLowerCase(),
      chainId: args.chainId,
      connectedAt: Date.now(),
    });
  },
});

export const disconnect = mutation({
  args: { walletId: v.id("wallets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found");
    }

    await ctx.db.delete(args.walletId);
  },
});
