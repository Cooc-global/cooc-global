import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Wallet, TrendingUp, Users, DollarSign, UserPlus, UserX, Ban, CheckCircle, Trash2, TrendingDown, PlayCircle, Calendar, ShoppingCart, Edit3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DeveloperStats {
  totalUsers: number;
  totalTransactions: number;
  totalFees: number;
  developerBalance: number;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  wallet_address: string;
  role: string;
  status: string;
  created_at: string;
  balance: number;
}

interface ExchangeRate {
  id: string;
  currency_pair: string;
  rate: number;
  active: boolean;
  set_by: string;
  created_at: string;
}

interface MarketplaceOffer {
  id: string;
  user_id: string;
  seller_name: string;
  phone_number: string;
  coins_for_sale: number;
  price_per_coin: number;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusAddress, setBonusAddress] = useState('');
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState(''); 
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserBalance, setNewUserBalance] = useState('0');

  // Exchange rates state
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [newCurrencyPair, setNewCurrencyPair] = useState('CLC/KSH');
  const [newRate, setNewRate] = useState('1.00');

  // Daily returns state  
  const [returnsProcessing, setReturnsProcessing] = useState(false);
  const [dailyReturnsData, setDailyReturnsData] = useState<any[]>([]);
  const [investmentsData, setInvestmentsData] = useState<any[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);

  // Marketplace state
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [editingOffer, setEditingOffer] = useState<MarketplaceOffer | null>(null);
  const [newOfferForm, setNewOfferForm] = useState({
    seller_name: '',
    phone_number: '',
    coins_for_sale: '',
    price_per_coin: '1.00',
    description: 'High-quality CLC coins available for immediate transfer. Verified seller with excellent transaction history.',
    status: 'active'
  });

  useEffect(() => {
    fetchDeveloperStats();
    fetchAllUsers();
    fetchExchangeRates();
    fetchInvestmentsData();
    fetchMarketplaceOffers();
  }, []);

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      // Get profiles without status field for now
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, wallet_address, role, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get wallet balances for each user
      const usersWithBalances = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', profile.user_id)
            .single();

          return {
            ...profile,
            balance: walletData?.balance || 0,
            status: 'active' // default status for now
          };
        })
      );

      setUsers(usersWithBalances);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleBlockUnblockUser = async (userId: string, currentStatus: string) => {
    toast({
      title: "Info",
      description: "User blocking feature will be available after database migration is complete.",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete user data manually for now
      await supabase.from('daily_returns').delete().eq('user_id', userId);
      await supabase.from('transactions').delete().eq('user_id', userId);
      await supabase.from('investments').delete().eq('user_id', userId);
      await supabase.from('marketplace').delete().eq('user_id', userId);
      await supabase.from('wallets').delete().eq('user_id', userId);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchAllUsers();
      fetchDeveloperStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;

    try {
      const newUserId = crypto.randomUUID();
      const walletAddr = '0x' + Math.random().toString(16).substring(2, 42);

      // Insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: newUserId,
          full_name: newUserName,
          email: newUserEmail,
          wallet_address: walletAddr
        });

      if (profileError) throw profileError;

      // Create wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: newUserId,
          balance: parseFloat(newUserBalance) || 0
        });

      if (walletError) throw walletError;

      toast({
        title: "Success",
        description: "User created successfully",
      });

      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserBalance('0');
      fetchAllUsers();
      fetchDeveloperStats();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

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

  const fetchExchangeRates = async () => {
    setRatesLoading(true);
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setExchangeRates(data || []);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast({
        title: "Error",
        description: "Failed to load exchange rates",
        variant: "destructive",
      });
    } finally {
      setRatesLoading(false);
    }
  };

  const fetchInvestmentsData = async () => {
    setReturnsLoading(true);
    try {
      // Get all investments
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (investmentsError) throw investmentsError;

      // Get all profiles to join with investments
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Create a map of user profiles for easy lookup
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Join investments with profile data
      const investmentsWithProfiles = investments?.map(investment => ({
        ...investment,
        profiles: profilesMap.get(investment.user_id) || { full_name: 'Unknown', email: 'Unknown' }
      })) || [];

      // Get today's daily returns
      const { data: dailyReturns, error: returnsError } = await supabase
        .from('daily_returns')
        .select('*')
        .eq('return_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (returnsError) throw returnsError;

      // Join daily returns with profile and investment data
      const dailyReturnsWithProfiles = dailyReturns?.map(dailyReturn => {
        const profile = profilesMap.get(dailyReturn.user_id) || { full_name: 'Unknown' };
        const investment = investments?.find(inv => inv.id === dailyReturn.investment_id);
        return {
          ...dailyReturn,
          profiles: profile,
          investments: { amount: investment?.amount || 0 }
        };
      }) || [];

      setInvestmentsData(investmentsWithProfiles);
      setDailyReturnsData(dailyReturnsWithProfiles);
    } catch (error) {
      console.error('Error fetching investments data:', error);
      toast({
        title: "Error",
        description: "Failed to load investments data",
        variant: "destructive",
      });
    } finally {
      setReturnsLoading(false);
    }
  };

  const handleProcessDailyReturns = async () => {
    setReturnsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('process_daily_returns_now');

      if (error) throw error;

      const response = data as any;
      if (response?.success) {
        toast({
          title: "Success",
          description: response.message || "Daily returns processed successfully",
        });
        fetchInvestmentsData();
        fetchDeveloperStats();
      } else {
        toast({
          title: "Error",
          description: response?.error || "Failed to process daily returns",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing daily returns:', error);
      toast({
        title: "Error",
        description: "Failed to process daily returns",
        variant: "destructive",
      });
    } finally {
      setReturnsProcessing(false);
    }
  };

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrencyPair || !newRate || parseFloat(newRate) <= 0) return;

    try {
      // Deactivate existing rate for this currency pair
      await supabase
        .from('exchange_rates')
        .update({ active: false })
        .eq('currency_pair', newCurrencyPair);

      // Create new rate
      const { error } = await supabase
        .from('exchange_rates')
        .insert({
          currency_pair: newCurrencyPair,
          rate: parseFloat(newRate),
          set_by: user?.id,
          active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Exchange rate for ${newCurrencyPair} set to ${newRate}`,
      });

      setNewRate('1.00');
      fetchExchangeRates();
    } catch (error) {
      console.error('Error creating exchange rate:', error);
      toast({
        title: "Error",
        description: "Failed to set exchange rate",
        variant: "destructive",
      });
    }
  };

  const handleToggleRate = async (rateId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('exchange_rates')
        .update({ active: !currentActive })
        .eq('id', rateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Exchange rate ${currentActive ? 'deactivated' : 'activated'}`,
      });

      fetchExchangeRates();
    } catch (error) {
      console.error('Error toggling exchange rate:', error);
      toast({
        title: "Error",
        description: "Failed to update exchange rate",
        variant: "destructive",
      });
    }
  };

  // Marketplace Management Functions
  const fetchMarketplaceOffers = async () => {
    setMarketplaceLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMarketplaceOffers(data || []);
    } catch (error) {
      console.error('Error fetching marketplace offers:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace offers",
        variant: "destructive",
      });
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const handleCreateMarketplaceOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferForm.seller_name || !newOfferForm.phone_number || !newOfferForm.coins_for_sale) return;

    try {
      const fakeUserId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('marketplace')
        .insert({
          user_id: fakeUserId,
          seller_name: newOfferForm.seller_name,
          phone_number: newOfferForm.phone_number,
          coins_for_sale: parseFloat(newOfferForm.coins_for_sale),
          price_per_coin: parseFloat(newOfferForm.price_per_coin),
          description: newOfferForm.description,
          status: newOfferForm.status
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fictional marketplace offer created successfully",
      });

      setNewOfferForm({
        seller_name: '',
        phone_number: '',
        coins_for_sale: '',
        price_per_coin: '1.00',
        description: 'High-quality CLC coins available for immediate transfer. Verified seller with excellent transaction history.',
        status: 'active'
      });
      fetchMarketplaceOffers();
    } catch (error) {
      console.error('Error creating marketplace offer:', error);
      toast({
        title: "Error",
        description: "Failed to create marketplace offer",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMarketplaceOffer = async (offerId: string, updatedData: Partial<MarketplaceOffer>) => {
    try {
      const { error } = await supabase
        .from('marketplace')
        .update(updatedData)
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Marketplace offer updated successfully",
      });

      fetchMarketplaceOffers();
      setEditingOffer(null);
    } catch (error) {
      console.error('Error updating marketplace offer:', error);
      toast({
        title: "Error",
        description: "Failed to update marketplace offer",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMarketplaceOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Marketplace offer deleted successfully",
      });

      fetchMarketplaceOffers();
    } catch (error) {
      console.error('Error deleting marketplace offer:', error);
      toast({
        title: "Error",
        description: "Failed to delete marketplace offer",
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Add User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New User
              </CardTitle>
              <CardDescription>
                Create a new user account with initial balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newUserName">Full Name</Label>
                    <Input
                      id="newUserName"
                      type="text"
                      placeholder="Enter full name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserEmail">Email</Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      placeholder="Enter email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserPassword">Password (for reference)</Label>
                    <Input
                      id="newUserPassword"
                      type="text"
                      placeholder="User will set this later"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserBalance">Initial Balance (CLC)</Label>
                    <Input
                      id="newUserBalance"
                      type="number"
                      placeholder="0"
                      value={newUserBalance}
                      onChange={(e) => setNewUserBalance(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users ({users.length})
              </CardTitle>
              <CardDescription>
                Manage all user accounts and their details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Settings className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">
                            {user.full_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {user.wallet_address.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-crypto font-semibold">
                            {user.balance.toLocaleString()} CLC
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'developer' ? 'destructive' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBlockUnblockUser(user.user_id, user.status)}
                                disabled={user.role === 'developer'}
                              >
                                {user.status === 'active' ? (
                                  <>
                                    <Ban className="w-3 h-3 mr-1" />
                                    Block
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Unblock
                                  </>
                                )}
                              </Button>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={user.role === 'developer'}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete User</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete {user.full_name}? This action cannot be undone and will delete all their data including transactions, investments, and wallet.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline">Cancel</Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleDeleteUser(user.user_id)}
                                    >
                                      Delete User
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-6">
          {/* Process Daily Returns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Daily Returns Processing
              </CardTitle>
              <CardDescription>
                Manually process 5% daily returns for all active investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Process Today's Returns</p>
                  <p className="text-sm text-muted-foreground">
                    This will calculate and add 5% daily returns directly to investor wallets
                  </p>
                </div>
                <Button 
                  onClick={handleProcessDailyReturns}
                  disabled={returnsProcessing}
                  variant="premium"
                >
                  {returnsProcessing ? (
                    <>
                      <Settings className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Process Returns
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Investments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Active Investments ({investmentsData.filter(inv => inv.status === 'active').length})
              </CardTitle>
              <CardDescription>
                Monitor all active investment accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {returnsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Settings className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Investor</TableHead>
                        <TableHead>Investment Amount</TableHead>
                        <TableHead>Daily Return</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Withdrawn</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investmentsData.filter(inv => inv.status === 'active').map((investment) => (
                        <TableRow key={investment.id}>
                          <TableCell className="font-medium">
                            {investment.profiles?.full_name || 'N/A'}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {investment.profiles?.email}
                            </span>
                          </TableCell>
                          <TableCell className="text-crypto font-semibold">
                            {parseFloat(investment.amount).toLocaleString()} CLC
                          </TableCell>
                          <TableCell className="text-success font-semibold">
                            {parseFloat(investment.daily_return || (investment.amount * 0.05)).toLocaleString()} CLC
                          </TableCell>
                          <TableCell>
                            {new Date(investment.start_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(investment.end_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                              {investment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-warning">
                            {parseFloat(investment.total_withdrawn || 0).toLocaleString()} CLC
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Processed Returns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Processed Returns ({dailyReturnsData.length})
              </CardTitle>
              <CardDescription>
                Returns processed for {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {returnsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Settings className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : dailyReturnsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No returns processed today yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Investor</TableHead>
                        <TableHead>Investment Amount</TableHead>
                        <TableHead>Return Amount</TableHead>
                        <TableHead>Processed At</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyReturnsData.map((returnData) => (
                        <TableRow key={returnData.id}>
                          <TableCell className="font-medium">
                            {returnData.profiles?.full_name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-crypto">
                            {parseFloat(returnData.investments?.amount || 0).toLocaleString()} CLC
                          </TableCell>
                          <TableCell className="text-success font-semibold">
                            {parseFloat(returnData.amount).toLocaleString()} CLC
                          </TableCell>
                          <TableCell>
                            {returnData.withdrawn_at 
                              ? new Date(returnData.withdrawn_at).toLocaleTimeString()
                              : 'Pending'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={returnData.withdrawn ? 'default' : 'secondary'}>
                              {returnData.withdrawn ? 'Added to Wallet' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          {/* Set Exchange Rate Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Set CLC Exchange Rate
              </CardTitle>
              <CardDescription>
                Control the price of CLC tokens in the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currencyPair">Currency Pair</Label>
                    <Input
                      id="currencyPair"
                      type="text"
                      placeholder="CLC/KSH"
                      value={newCurrencyPair}
                      onChange={(e) => setNewCurrencyPair(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: CLC/KSH, CLC/USD, etc.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exchangeRate">Exchange Rate</Label>
                    <Input
                      id="exchangeRate"
                      type="number"
                      placeholder="1.00"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Price per 1 CLC token
                    </p>
                  </div>
                </div>
                <Button type="submit" className="w-full" variant="premium">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Set Exchange Rate
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Exchange Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Current Exchange Rates ({exchangeRates.length})
              </CardTitle>
              <CardDescription>
                Manage all exchange rates for CLC tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ratesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Settings className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : exchangeRates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No exchange rates set yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Currency Pair</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exchangeRates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell className="font-medium">
                            {rate.currency_pair}
                          </TableCell>
                          <TableCell className="font-semibold text-crypto">
                            {rate.rate.toFixed(4)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rate.active ? 'default' : 'secondary'}>
                              {rate.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(rate.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={rate.active ? "outline" : "default"}
                              onClick={() => handleToggleRate(rate.id, rate.active)}
                            >
                              {rate.active ? (
                                <>
                                  <Ban className="w-3 h-3 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Add New Fictional User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Add Fictional Marketplace User
              </CardTitle>
              <CardDescription>
                Create fictional users with Kenyan names and Safaricom numbers to demonstrate marketplace activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMarketplaceOffer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sellerName">Seller Name</Label>
                    <Input
                      id="sellerName"
                      type="text"
                      placeholder="Grace Wanjiku"
                      value={newOfferForm.seller_name}
                      onChange={(e) => setNewOfferForm({...newOfferForm, seller_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Safaricom Number</Label>
                    <Input
                      id="phoneNumber"
                      type="text"
                      placeholder="+254 0700 123456"
                      value={newOfferForm.phone_number}
                      onChange={(e) => setNewOfferForm({...newOfferForm, phone_number: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coinsForSale">Coins for Sale</Label>
                    <Input
                      id="coinsForSale"
                      type="number"
                      placeholder="1000"
                      value={newOfferForm.coins_for_sale}
                      onChange={(e) => setNewOfferForm({...newOfferForm, coins_for_sale: e.target.value})}
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerCoin">Price per Coin (KSH)</Label>
                    <Input
                      id="pricePerCoin"
                      type="number"
                      placeholder="1.00"
                      value={newOfferForm.price_per_coin}
                      onChange={(e) => setNewOfferForm({...newOfferForm, price_per_coin: e.target.value})}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={newOfferForm.status}
                    onChange={(e) => setNewOfferForm({...newOfferForm, status: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Create Fictional User
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Marketplace Offers Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Marketplace Users ({marketplaceOffers.length})
              </CardTitle>
              <CardDescription>
                Manage all fictional and real marketplace users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marketplaceLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Settings className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : marketplaceOffers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No marketplace offers found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seller Name</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Coins</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketplaceOffers.map((offer) => (
                        <TableRow key={offer.id}>
                          <TableCell className="font-medium">
                            {editingOffer?.id === offer.id ? (
                              <Input
                                value={editingOffer.seller_name}
                                onChange={(e) => setEditingOffer({...editingOffer, seller_name: e.target.value})}
                                className="w-32"
                              />
                            ) : (
                              offer.seller_name
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {editingOffer?.id === offer.id ? (
                              <Input
                                value={editingOffer.phone_number}
                                onChange={(e) => setEditingOffer({...editingOffer, phone_number: e.target.value})}
                                className="w-32"
                              />
                            ) : (
                              offer.phone_number
                            )}
                          </TableCell>
                          <TableCell>
                            {editingOffer?.id === offer.id ? (
                              <Input
                                type="number"
                                value={editingOffer.coins_for_sale.toString()}
                                onChange={(e) => setEditingOffer({...editingOffer, coins_for_sale: parseFloat(e.target.value) || 0})}
                                className="w-24"
                              />
                            ) : (
                              `${offer.coins_for_sale.toLocaleString()} CLC`
                            )}
                          </TableCell>
                          <TableCell>
                            {editingOffer?.id === offer.id ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editingOffer.price_per_coin.toString()}
                                onChange={(e) => setEditingOffer({...editingOffer, price_per_coin: parseFloat(e.target.value) || 0})}
                                className="w-20"
                              />
                            ) : (
                              `${offer.price_per_coin} KSH`
                            )}
                          </TableCell>
                          <TableCell className="text-crypto font-semibold">
                            {(offer.coins_for_sale * offer.price_per_coin).toLocaleString()} KSH
                          </TableCell>
                          <TableCell>
                            {editingOffer?.id === offer.id ? (
                              <select
                                value={editingOffer.status}
                                onChange={(e) => setEditingOffer({...editingOffer, status: e.target.value})}
                                className="px-2 py-1 border rounded"
                              >
                                <option value="active">Active</option>
                                <option value="sold">Sold</option>
                              </select>
                            ) : (
                              <Badge variant={offer.status === 'sold' ? 'destructive' : 'default'}>
                                {offer.status === 'sold' ? 'SOLD' : 'AVAILABLE'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(offer.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {editingOffer?.id === offer.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateMarketplaceOffer(offer.id, editingOffer)}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingOffer(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingOffer(offer)}
                                  >
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Delete Marketplace Offer</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete {offer.seller_name}'s marketplace offer? This action cannot be undone.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button variant="outline">Cancel</Button>
                                        <Button 
                                          variant="destructive"
                                          onClick={() => handleDeleteMarketplaceOffer(offer.id)}
                                        >
                                          Delete Offer
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperPanel;