import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Gift } from 'lucide-react';

interface ReferralData {
  referral_code: string;
  referred_by: string | null;
  total_referrals: number;
  total_earned: number;
}

const ReferralSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      // Get user's referral code and who referred them
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code, referred_by')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        return;
      }

      // Count total referrals
      const { count: totalReferrals, error: referralsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', profile.referral_code);

      if (referralsError) {
        console.error('Referrals count error:', referralsError);
      }

      // Calculate total earned from referral bonuses
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('transaction_type', 'referral_bonus');

      if (transactionsError) {
        console.error('Transactions error:', transactionsError);
      }

      const totalEarned = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setReferralData({
        referral_code: profile.referral_code,
        referred_by: profile.referred_by,
        total_referrals: totalReferrals || 0,
        total_earned: totalEarned
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (referralData?.referral_code) {
      await navigator.clipboard.writeText(referralData.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const copyReferralLink = async () => {
    if (referralData?.referral_code) {
      const referralLink = `${window.location.origin}/auth?ref=${referralData.referral_code}`;
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading referral data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Referral Code</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralData?.referral_code}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyReferralCode}
              className="mt-2"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralData?.total_referrals}</div>
            <p className="text-xs text-muted-foreground">
              People who used your code
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralData?.total_earned.toFixed(2)} CLC</div>
            <p className="text-xs text-muted-foreground">
              5% bonus from referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
          <CardDescription>
            Earn 5% of every transfer your referrals make!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Share Your Referral Link:</h4>
            <div className="flex items-center space-x-2">
              <Input 
                value={`${window.location.origin}/auth?ref=${referralData?.referral_code}`}
                readOnly
                className="bg-background"
              />
              <Button onClick={copyReferralLink} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold mb-1">🎯 How to Earn:</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Share your referral code or link</li>
                <li>• New users sign up with your code</li>
                <li>• You earn 5% of their transfers</li>
                <li>• Earnings are added instantly</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-1">💡 Tips:</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Share on social media</li>
                <li>• Tell friends and family</li>
                <li>• Explain the benefits of CLC</li>
                <li>• More active users = more earnings</li>
              </ul>
            </div>
          </div>

          {referralData?.referred_by && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm">
                <strong>You were referred by:</strong> {referralData.referred_by}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSection;