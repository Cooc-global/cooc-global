import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { History, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  from_address?: string;
  to_address?: string;
  status: string;
  description?: string;
  created_at: string;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
      case 'transfer_in':
      case 'daily_return':
      case 'donation':
        return <ArrowDownLeft className="w-4 h-4 text-success" />;
      case 'sell':
      case 'transfer_out':
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      default:
        return <Wallet className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'transfer_in':
      case 'daily_return':
      case 'donation':
        return 'text-success';
      case 'sell':
      case 'transfer_out':
      case 'withdrawal':
        return 'text-destructive';
      case 'investment':
        return 'text-primary';
      default:
        return 'text-foreground';
    }
  };

  const formatTransactionType = (type: string) => {
    const types: { [key: string]: string } = {
      buy: 'Purchase',
      sell: 'Sale',
      transfer_in: 'Transfer In',
      transfer_out: 'Transfer Out',
      investment: 'Investment',
      withdrawal: 'Withdrawal',
      daily_return: 'Daily Return',
      donation: 'Donation'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Transaction History
        </CardTitle>
        <CardDescription>
          Your recent CLC transactions and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No transactions found. Start by buying some CLC!
          </p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getTransactionIcon(transaction.transaction_type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {formatTransactionType(transaction.transaction_type)}
                      </p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.description || 'No description'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                    {['buy', 'transfer_in', 'daily_return', 'donation'].includes(transaction.transaction_type) ? '+' : '-'}
                    {transaction.amount.toLocaleString()} CLC
                  </p>
                  {transaction.from_address && (
                    <p className="text-xs text-muted-foreground">
                      From: {transaction.from_address.slice(0, 6)}...{transaction.from_address.slice(-4)}
                    </p>
                  )}
                  {transaction.to_address && (
                    <p className="text-xs text-muted-foreground">
                      To: {transaction.to_address.slice(0, 6)}...{transaction.to_address.slice(-4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;