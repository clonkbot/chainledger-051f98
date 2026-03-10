import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { formatAddress } from "../lib/utils";
import { Wallet, Link2, Unlink, RefreshCw, Plus } from "lucide-react";

interface WalletData {
  _id: string;
  address: string;
  connectedAt: number;
}

export function WalletConnect() {
  const wallets = useQuery(api.wallets.list);
  const connectWallet = useMutation(api.wallets.connect);
  const disconnectWallet = useMutation(api.wallets.disconnect);
  const fetchTransactions = useAction(api.transactions.fetchFromBlockchain);

  const [address, setAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Invalid Ethereum address");
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      await connectWallet({ address, chainId: 8453 }); // Base mainnet
      setAddress("");
      setShowInput(false);
    } catch (err) {
      setError("Could not connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFetch = async (walletAddress: string) => {
    setIsFetching(walletAddress);
    try {
      await fetchTransactions({ walletAddress });
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setIsFetching(null);
    }
  };

  const handleDisconnect = async (walletId: string) => {
    try {
      await disconnectWallet({ walletId: walletId as any });
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  return (
    <Card className="border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Connected Wallets</CardTitle>
            <p className="text-sm text-zinc-500">Base network</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(!showInput)}
          className="text-violet-400 hover:text-violet-300"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showInput && (
          <form onSubmit={handleConnect} className="space-y-3">
            <Input
              placeholder="0x... (Base wallet address)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono text-sm"
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isConnecting}>
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-1" />
                    Connect
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowInput(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {wallets === undefined ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-zinc-400 text-sm">No wallets connected</p>
            {!showInput && (
              <Button variant="outline" size="sm" onClick={() => setShowInput(true)}>
                Connect your first wallet
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map((wallet: WalletData) => (
              <div
                key={wallet._id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
                    <span className="text-xs font-bold text-violet-400">B</span>
                  </div>
                  <div>
                    <p className="font-mono text-sm text-white">
                      {formatAddress(wallet.address)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Connected {new Date(wallet.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleFetch(wallet.address)}
                    disabled={isFetching === wallet.address}
                    title="Fetch transactions"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isFetching === wallet.address ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDisconnect(wallet._id)}
                    title="Disconnect"
                  >
                    <Unlink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
