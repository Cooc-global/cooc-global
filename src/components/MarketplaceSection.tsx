import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Phone, Plus, Trash2 } from 'lucide-react';

interface MarketplaceOffer {
  id: string;
  seller_name: string;
  phone_number: string;
  coins_for_sale: number;
  price_per_coin: number;
  description: string;
  created_at: string;
  user_id: string;
}

interface MarketplaceSectionProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
}

const MarketplaceSection = ({ wallet, profile }: MarketplaceSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [coinsToSell, setCoinsToSell] = useState('');
  const [pricePerCoin, setPricePerCoin] = useState('1.00');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching marketplace offers:', error);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinsToSell || !phoneNumber || parseFloat(coinsToSell) <= 0) return;

    const coinsAmount = parseFloat(coinsToSell);
    if (coinsAmount > (wallet?.balance || 0)) {
      toast({
        title: "Error",
        description: "You cannot sell more coins than you have",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace')
        .insert({
          user_id: user?.id,
          seller_name: profile?.full_name || 'Anonymous',
          phone_number: phoneNumber,
          coins_for_sale: coinsAmount,
          price_per_coin: parseFloat(pricePerCoin),
          description: description || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your coin sale offer has been posted to the marketplace",
      });

      // Reset form
      setCoinsToSell('');
      setPricePerCoin('1.00');
      setPhoneNumber('');
      setDescription('');
      setShowForm(false);
      
      fetchOffers();
    } catch (error) {
      console.error('Error creating marketplace offer:', error);
      toast({
        title: "Error",
        description: "Failed to create marketplace offer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace')
        .delete()
        .eq('id', offerId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Offer removed from marketplace",
      });

      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: "Error",
        description: "Failed to remove offer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Offer Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Sell Your Coins
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? 'Cancel' : 'Create Offer'}
            </Button>
          </CardTitle>
          <CardDescription>
            Post your coins for sale to other investors
          </CardDescription>
        </CardHeader>
        
        {showForm && (
          <CardContent>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coinsToSell">Coins to Sell</Label>
                  <Input
                    id="coinsToSell"
                    type="number"
                    placeholder="Enter number of coins"
                    value={coinsToSell}
                    onChange={(e) => setCoinsToSell(e.target.value)}
                    min="0.01"
                    step="0.01"
                    max={wallet?.balance || 0}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: {wallet?.balance?.toLocaleString() || 0} CLC
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pricePerCoin">Price per Coin (KSH)</Label>
                  <Input
                    id="pricePerCoin"
                    type="number"
                    placeholder="1.00"
                    value={pricePerCoin}
                    onChange={(e) => setPricePerCoin(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Contact Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+254 XXX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Any additional details about your offer..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Total Value: {coinsToSell && pricePerCoin ? 
                  `${(parseFloat(coinsToSell || '0') * parseFloat(pricePerCoin || '0')).toLocaleString()} KSH` 
                  : '0 KSH'}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Offer...' : 'Post to Marketplace'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Marketplace Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Active Marketplace Offers</CardTitle>
          <CardDescription>
            Coins available for purchase from other investors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coins available for sale at the moment
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="font-semibold">{offer.seller_name}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 mr-1" />
                        {offer.phone_number}
                      </div>
                    </div>
                    {offer.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Coins:</span>
                      <div className="font-medium">{offer.coins_for_sale.toLocaleString()} CLC</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <div className="font-medium">{offer.price_per_coin} KSH/coin</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <div className="font-medium">{(offer.coins_for_sale * offer.price_per_coin).toLocaleString()} KSH</div>
                    </div>
                  </div>

                  {offer.description && (
                    <div className="text-sm text-muted-foreground">
                      {offer.description}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Posted: {new Date(offer.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketplaceSection;