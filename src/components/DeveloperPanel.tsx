import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Wallet, TrendingUp, Users, DollarSign, UserPlus, UserX, Ban, CheckCircle, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    fetchDeveloperStats();
    fetchAllUsers();
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default DeveloperPanel;