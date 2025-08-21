import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Phone, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MarketplaceOffer {
  id: string;
  seller_name: string;
  phone_number: string;
  coins_for_sale: number;
  price_per_coin: number;
  created_at: string;
  user_id: string;
  status: string;
}

interface MarketplacePanelProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
}

const MarketplacePanel = ({ wallet, profile }: MarketplacePanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Form state
  const [coinsToSell, setCoinsToSell] = useState('');
  const [pricePerCoin, setPricePerCoin] = useState('1.00');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const isFictionalUser = (offer: MarketplaceOffer): boolean => {
    const isCurrentUser = offer.user_id === user?.id;
    const hasSafaricomNumber = offer.phone_number?.includes('+254 07') || offer.phone_number?.startsWith('07');
    return !isCurrentUser && hasSafaricomNumber;
  };

  const hidePhoneDigits = (phoneNumber: string): string => {
    if (!phoneNumber || phoneNumber.length < 3) return phoneNumber;
    return phoneNumber.slice(0, -3) + '***';
  };

  const displayPhoneNumber = (offer: MarketplaceOffer): string => {
    if (isFictionalUser(offer) && offer.status === 'sold') {
      return hidePhoneDigits(offer.phone_number);
    }
    return offer.phone_number;
  };

  const fetchOffers = async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('marketplace')
          .select('*')
          .in('status', ['active', 'sold'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOffers(data || []);
      } else {
        const { data: activeData, error: activeError } = await supabase
          .rpc('get_marketplace_offers_public');
        
        const { data: soldData, error: soldError } = await supabase
          .from('marketplace')
          .select('id, user_id, seller_name, coins_for_sale, price_per_coin, description, status, created_at, updated_at')
          .eq('status', 'sold')
          .order('created_at', { ascending: false });

        if (activeError) throw activeError;
        if (soldError) throw soldError;

        const allOffers = [
          ...(activeData || []).map(offer => ({ ...offer, phone_number: '' })),
          ...(soldData || []).map(offer => ({ ...offer, phone_number: '' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setOffers(allOffers);
      }
    } catch (error) {
      console.error('Error fetching marketplace offers:', error);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= (wallet?.balance || 0);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coinsToSell || !phoneNumber || !pricePerCoin) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number (10-15 digits)",
        variant: "destructive",
      });
      return;
    }

    if (!validateAmount(coinsToSell)) {
      toast({
        title: "Error",
        description: "Invalid coin amount or insufficient balance",
        variant: "destructive",
      });
      return;
    }

    const coinsAmount = parseFloat(coinsToSell);
    const priceAmount = parseFloat(pricePerCoin);
    
    if (priceAmount <= 0) {
      toast({
        title: "Error",
        description: "Price per coin must be greater than 0",
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
          price_per_coin: parseFloat(pricePerCoin)
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your coin sale offer has been posted to the marketplace",
      });

      setCoinsToSell('');
      setPricePerCoin('1.00');
      setPhoneNumber('');
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

  const activeOffers = offers.filter(offer => offer.status === 'active');
  const recentSales = offers.filter(offer => offer.status === 'sold').slice(0, 3);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Marketplace
            <Badge variant="outline" className="ml-2 text-xs">
              {activeOffers.length} Active
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Sell
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {showForm && (
          <div className="border rounded-md p-3 bg-muted/30">
            <form onSubmit={handleCreateOffer} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="coinsToSell" className="text-xs">Coins</Label>
                  <Input
                    id="coinsToSell"
                    type="number"
                    placeholder="Amount"
                    value={coinsToSell}
                    onChange={(e) => setCoinsToSell(e.target.value)}
                    className="h-7 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerCoin" className="text-xs">Price (KSH)</Label>
                  <Input
                    id="pricePerCoin"
                    type="number"
                    placeholder="1.00"
                    value={pricePerCoin}
                    onChange={(e) => setPricePerCoin(e.target.value)}
                    className="h-7 text-xs"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-xs">Phone</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+254 XXX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-7 text-xs"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-7 text-xs" disabled={loading}>
                {loading ? 'Posting...' : 'Post Offer'}
              </Button>
            </form>
          </div>
        )}

        {/* Active Offers */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground">Active Offers</h4>
          {activeOffers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No active offers</p>
          ) : (
            <div className="space-y-1">
              {activeOffers.slice(0, 2).map((offer) => (
                <div key={offer.id} className="border rounded p-2 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium truncate">{offer.seller_name}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="default" className="text-xs px-1 h-4 bg-green-500">
                        LIVE
                      </Badge>
                      {offer.user_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="h-4 w-4 p-0 text-destructive"
                        >
                          <Trash2 className="w-2 h-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {user && offer.phone_number && (
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <Phone className="w-2 h-2 mr-1" />
                      {displayPhoneNumber(offer)}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">Coins:</span>
                      <div className="font-medium">{offer.coins_for_sale.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">@</span>
                      <div className="font-medium">{offer.price_per_coin} KSH</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <div className="font-medium">{(offer.coins_for_sale * offer.price_per_coin).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {activeOffers.length > 2 && (
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full h-6 text-xs">
                      {isExpanded ? (
                        <>Less <ChevronUp className="w-3 h-3 ml-1" /></>
                      ) : (
                        <>+{activeOffers.length - 2} more <ChevronDown className="w-3 h-3 ml-1" /></>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {activeOffers.slice(2).map((offer) => (
                      <div key={offer.id} className="border rounded p-2 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium truncate">{offer.seller_name}</span>
                          <Badge variant="default" className="text-xs px-1 h-4 bg-green-500">
                            LIVE
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div>{offer.coins_for_sale.toLocaleString()}</div>
                          <div>@{offer.price_per_coin}</div>
                          <div>{(offer.coins_for_sale * offer.price_per_coin).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        {recentSales.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Recent Sales</h4>
            <div className="space-y-1">
              {recentSales.map((offer) => (
                <div key={offer.id} className="border rounded p-2 text-xs bg-muted/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">{offer.seller_name}</span>
                    <Badge variant="destructive" className="text-xs px-1 h-4">
                      SOLD
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                    <div>{offer.coins_for_sale.toLocaleString()}</div>
                    <div>@{offer.price_per_coin}</div>
                    <div>{(offer.coins_for_sale * offer.price_per_coin).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketplacePanel;