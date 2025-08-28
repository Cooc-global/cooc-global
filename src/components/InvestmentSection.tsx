import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Calendar, DollarSign, Percent } from 'lucide-react';
import { CLCCoin } from '@/components/ui/clc-coin';
import clcLogo from '@/assets/clc-coin-logo.png';

interface Investment {
  id: string;
  amount: number;
  daily_return: number;
  start_date: string;
  end_date: string;
  status: string;
  total_withdrawn: number;
}

interface DailyReturn {
  id: string;
  amount: number;
  return_date: string;
  withdrawn: boolean;
}

interface InvestmentSectionProps {
  wallet: { balance: number; locked_balance: number } | null;
  onInvestmentUpdate: () => void;
}

const InvestmentSection = ({ wallet, onInvestmentUpdate }: InvestmentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };


  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) return;

    const amount = parseFloat(investmentAmount);
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
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 90); // 90 days investment period

      const dailyReturn = amount * 0.05; // 5% daily return

      // Create investment record
      const { error: investmentError } = await supabase
        .from('investments')
        .insert({
          user_id: user?.id,
          amount: amount,
          daily_return: dailyReturn,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });

      if (investmentError) throw investmentError;

      // Update wallet balances
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: (wallet?.balance || 0) - amount,
          locked_balance: (wallet?.locked_balance || 0) + amount
        })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      // Record investment transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'investment',
          amount: amount,
          description: `Invested ${amount} CLC for 90 days at 5% daily return`
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: `Successfully invested ${amount} CLC`,
      });

      setInvestmentAmount('');
      fetchInvestments();
      onInvestmentUpdate();
    } catch (error) {
      console.error('Error creating investment:', error);
      toast({
        title: "Error",
        description: "Failed to create investment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Investment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CLCCoin size="sm" variant="premium" className="mr-3" />
            Create Investment
          </CardTitle>
          <CardDescription>
            Invest your CLC for 90 days and earn 5% daily returns (automatically added to your wallet)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="investmentAmount">Investment Amount (CLC)</Label>
              <Input
                id="investmentAmount"
                type="number"
                placeholder="Enter amount to invest"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                min="1"
                step="0.01"
                max={wallet?.balance || 0}
                required
              />
            </div>
            {investmentAmount && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Investment Summary:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Daily Return:</span>
                    <span className="font-medium ml-2">
                      {(parseFloat(investmentAmount || '0') * 0.05).toFixed(2)} CLC
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Return (90 days):</span>
                    <span className="font-medium ml-2 text-success">
                      {(parseFloat(investmentAmount || '0') * 0.05 * 90).toFixed(2)} CLC
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <CLCCoin size="xs" className="mr-2" />
              {loading ? 'Creating Investment...' : 'Invest CLC'}
            </Button>
          </form>
        </CardContent>
      </Card>


      {/* Active Investments */}
      {investments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Your Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.map((investment) => (
                <div key={investment.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">{investment.amount.toLocaleString()} CLC</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Return</p>
                      <p className="font-medium text-success">{investment.daily_return.toFixed(2)} CLC</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{new Date(investment.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{new Date(investment.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      investment.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {investment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvestmentSection;