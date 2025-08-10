import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Wallet, TrendingUp, Users, DollarSign } from 'lucide-react';

interface DeveloperStats {
  totalUsers: number;
  totalTransactions: number;
  totalFees: number;
  developerBalance: number;
}

const DeveloperPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DeveloperStats>({
    totalUsers: 0,
    totalTransactions: 0,
    totalFees: 0,
    developerBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusAddress, setBonusAddress] = useState('');

  useEffect(() => {
    fetchDeveloperStats();
  }, []);

  const fetchDeveloperStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total transactions
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // Get developer balance
      const { data: developerProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('role', 'developer')
        .single();

      let developerBalance = 0;
      if (developerProfile) {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', developerProfile.user_id)
          .single();
        
        developerBalance = walletData?.balance || 0;
      }

      // Get total fees collected
      const { data: feeTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('transaction_type', 'fee_received');

      const totalFees = feeTransactions?.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalTransactions: transactionCount || 0,
        totalFees,
        developerBalance
      });
    } catch (error) {
      console.error('Error fetching developer stats:', error);
      toast({
        title: "Error",
        description: "Failed to load developer statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGiveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusAmount || !bonusAddress || parseFloat(bonusAmount) <= 0) return;

    try {
      const amount = parseFloat(bonusAmount);
      
      // Find user by wallet address
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('wallet_address', bonusAddress)
        .single();

      if (!recipientProfile) {
        toast({
          title: "Error",
          description: "Wallet address not found",
          variant: "destructive",
        });
        return;
      }

      // Get current balance
      const { data: currentWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', recipientProfile.user_id)
        .single();

      // Add bonus to recipient wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: (currentWallet?.balance || 0) + amount
        })
        .eq('user_id', recipientProfile.user_id);

      if (walletError) throw walletError;

      // Record bonus transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: recipientProfile.user_id,
          transaction_type: 'bonus',
          amount: amount,
          to_address: bonusAddress,
          description: `Bonus from developer: ${amount} CLC`
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: `Successfully gave ${amount} CLC bonus to ${bonusAddress}`,
      });

      setBonusAmount('');
      setBonusAddress('');
      fetchDeveloperStats();
    } catch (error) {
      console.error('Error giving bonus:', error);
      toast({
        title: "Error",
        description: "Failed to give bonus",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Settings className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Settings className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Developer Panel</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Developer Balance</CardTitle>
            <Wallet className="h-4 w-4 text-crypto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-crypto">
              {stats.developerBalance.toLocaleString()} CLC
            </div>
            <p className="text-xs text-muted-foreground">
              System wallet balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              All-time transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.totalFees.toLocaleString()} CLC
            </div>
            <p className="text-xs text-muted-foreground">
              10% transaction fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Give Bonus Section */}
      <Card>
        <CardHeader>
          <CardTitle>Give User Bonus</CardTitle>
          <CardDescription>
            Award bonus CLC to any user wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGiveBonus} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bonusAmount">Bonus Amount (CLC)</Label>
                <Input
                  id="bonusAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonusAddress">Recipient Wallet Address</Label>
                <Input
                  id="bonusAddress"
                  type="text"
                  placeholder="0x..."
                  value={bonusAddress}
                  onChange={(e) => setBonusAddress(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="premium" className="w-full">
              Give Bonus
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperPanel;