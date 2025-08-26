import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send } from 'lucide-react';
import clcLogo from '@/assets/clc-coin-logo.png';

interface WalletSectionProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
  onWalletUpdate: () => void;
}

const WalletSection = ({ wallet, profile, onWalletUpdate }: WalletSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [loading, setLoading] = useState(false);

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
      // Use the database function to process transfer with fee
      const { data: result, error } = await supabase.rpc('process_transfer_with_fee', {
        sender_id: user?.id,
        recipient_address: transferAddress,
        amount: amount
      });

      if (error) throw error;
      
      const resultData = result as any;
      
      if (!resultData.success) {
        toast({
          title: "Error",
          description: resultData.error,
          variant: "destructive",
        });
        return;
      }

      const feeAmount = resultData.fee_amount;
      const netAmount = resultData.net_amount;

      // Record outgoing transaction for sender
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'transfer_out',
          amount: amount,
          from_address: profile?.wallet_address,
          to_address: transferAddress,
          description: `Transferred ${amount} CLC (fee: ${feeAmount} CLC, net: ${netAmount} CLC)`
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: `Successfully transferred ${amount} CLC (10% fee: ${feeAmount} CLC applied)`,
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
    <div className="space-y-6">
      {/* Transfer CLC */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <img src={clcLogo} alt="CLC Coin" className="w-5 h-5 mr-2" />
              Transfer CLC
            </CardTitle>
            <CardDescription>
              Send CLC to another wallet (10% transaction fee applies)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransferCLC} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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