import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Send, CreditCard } from 'lucide-react';

interface WalletSectionProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string } | null;
  onWalletUpdate: () => void;
}

const WalletSection = ({ wallet, profile, onWalletUpdate }: WalletSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuyCLC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyAmount || parseFloat(buyAmount) <= 0) return;

    setLoading(true);
    try {
      const amount = parseFloat(buyAmount);
      
      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: (wallet?.balance || 0) + amount
        })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'buy',
          amount: amount,
          to_address: profile?.wallet_address,
          description: `Purchased ${amount} CLC`
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: `Successfully purchased ${amount} CLC`,
      });

      setBuyAmount('');
      onWalletUpdate();
    } catch (error) {
      console.error('Error buying CLC:', error);
      toast({
        title: "Error",
        description: "Failed to purchase CLC",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferCLC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || !transferAddress || parseFloat(transferAmount) <= 0) return;

    const amount = parseFloat(transferAmount);
    if (amount > (wallet?.balance || 0)) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update sender's balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: (wallet?.balance || 0) - amount
        })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      // Record outgoing transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'transfer_out',
          amount: amount,
          from_address: profile?.wallet_address,
          to_address: transferAddress,
          description: `Transferred ${amount} CLC to ${transferAddress}`
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: `Successfully transferred ${amount} CLC`,
      });

      setTransferAmount('');
      setTransferAddress('');
      onWalletUpdate();
    } catch (error) {
      console.error('Error transferring CLC:', error);
      toast({
        title: "Error",
        description: "Failed to transfer CLC",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Buy CLC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Buy Collo Coin
          </CardTitle>
          <CardDescription>
            Purchase CLC at 1 CLC = 1 KSH
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBuyCLC} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyAmount">Amount (CLC)</Label>
              <Input
                id="buyAmount"
                type="number"
                placeholder="Enter amount to buy"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                min="1"
                step="0.01"
                required
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Cost: {buyAmount ? `${parseFloat(buyAmount || '0').toLocaleString()} KSH` : '0 KSH'}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Buy CLC'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transfer CLC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="w-5 h-5 mr-2" />
            Transfer CLC
          </CardTitle>
          <CardDescription>
            Send CLC to another wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransferCLC} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transferAmount">Amount (CLC)</Label>
              <Input
                id="transferAmount"
                type="number"
                placeholder="Enter amount to transfer"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                min="0.01"
                step="0.01"
                max={wallet?.balance || 0}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferAddress">Recipient Wallet Address</Label>
              <Input
                id="transferAddress"
                type="text"
                placeholder="0x..."
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Transferring...' : 'Transfer CLC'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletSection;