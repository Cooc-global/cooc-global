import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useCLCPrice } from '@/hooks/useCLCPrice';
import { ShoppingCart, Plus, Trash2, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMarketplace, MarketplaceFormData } from '@/hooks/useMarketplace';
import { useToast } from '@/hooks/use-toast';

interface MarketplacePanelProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
}

const MarketplacePanel = ({ wallet, profile }: MarketplacePanelProps) => {
  const { user } = useAuth();
  const { priceData: clcPrice } = useCLCPrice();
  const { toast } = useToast();
  const {
    activeOffers,
    recentSales,
    loading,
    createOffer,
    deleteOffer,
    displayPhoneNumber
  } = useMarketplace();
  
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Form state - initialize with current CLC price
  const [coinsToSell, setCoinsToSell] = useState('');
  const [pricePerCoin, setPricePerCoin] = useState(clcPrice.price.toString());
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceValue = parseFloat(pricePerCoin);
    if (priceValue < 10) {
      toast({
        title: "Price Too Low",
        description: "Minimum price per CLC is KSH 10.00",
        variant: "destructive",
      });
      return;
    }
    
    const formData: MarketplaceFormData = {
      coinsToSell,
      pricePerCoin,
      phoneNumber,
      paymentMethods: []
    };

    const success = await createOffer(formData, profile, wallet?.balance || 0);
    
    if (success) {
      setCoinsToSell('');
      setPricePerCoin(clcPrice.price.toString());
      setPhoneNumber('');
      setShowForm(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    await deleteOffer(offerId);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-1 px-3 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xs font-medium">
            <ShoppingCart className="w-3 h-3 mr-1" />
            Market
            <Badge variant="outline" className="ml-1 text-xs px-1 py-0 h-3">
              {activeOffers.length}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="h-4 px-1 text-xs hover:bg-muted"
          >
            <Plus className="w-2 h-2" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 pb-3 pt-0">
        {showForm && (
          <div className="border rounded p-2 bg-muted/30 mb-2">
            <form onSubmit={handleCreateOffer} className="space-y-1">
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="Coins"
                  value={coinsToSell}
                  onChange={(e) => setCoinsToSell(e.target.value)}
                  className="h-5 text-xs flex-1"
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  min="10.00"
                  placeholder={`KSH (Min: 10.00, Current: ${clcPrice.price.toFixed(2)})`}
                  value={pricePerCoin}
                  onChange={(e) => setPricePerCoin(e.target.value)}
                  className="h-5 text-xs flex-1"
                  required
                />
              </div>
              <Input
                type="tel"
                placeholder="Phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-5 text-xs"
                required
              />
              <Button type="submit" className="w-full h-5 text-xs" disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </div>
        )}

        {/* Compact Active Offers */}
        <div className="space-y-1">
          {activeOffers.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Active</span>
                {activeOffers.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-3 px-1"
                  >
                    {isExpanded ? 
                      <ChevronUp className="w-2 h-2" /> : 
                      <ChevronDown className="w-2 h-2" />
                    }
                  </Button>
                )}
              </div>
              
              {/* First offer always visible */}
              <div className="border rounded p-1.5 bg-card">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium truncate max-w-[80px]">
                    {activeOffers[0].seller_name}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {activeOffers[0].user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOffer(activeOffers[0].id)}
                        className="h-3 w-3 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-2 h-2" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {user && activeOffers[0].phone_number && (
                  <div className="flex items-center text-xs text-muted-foreground mb-1">
                    <Phone className="w-2 h-2 mr-1" />
                    <span className="truncate text-xs">
                      {displayPhoneNumber(activeOffers[0])}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-xs">
                  <span>{activeOffers[0].coins_for_sale.toLocaleString()}</span>
                  <span>KSH {activeOffers[0].price_per_coin}</span>
                  <span>KSH {(activeOffers[0].coins_for_sale * activeOffers[0].price_per_coin).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Additional offers - collapsible */}
              {activeOffers.length > 1 && (
                <Collapsible open={isExpanded}>
                  <CollapsibleContent>
                    {activeOffers.slice(1, 3).map((offer) => (
                      <div key={offer.id} className="border rounded p-1.5 bg-card mt-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium truncate max-w-[80px]">
                            {offer.seller_name}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            {offer.user_id === user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="h-3 w-3 p-0 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-2 h-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>{offer.coins_for_sale.toLocaleString()}</span>
                          <span>KSH {offer.price_per_coin}</span>
                          <span>KSH {(offer.coins_for_sale * offer.price_per_coin).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
          
          {activeOffers.length === 0 && (
            <div className="text-center py-2">
              <span className="text-xs text-muted-foreground">No active offers</span>
            </div>
          )}
        </div>

        {/* Recent Sales - Very minimal */}
        {recentSales.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Recent</span>
              <Badge variant="secondary" className="text-xs px-1 py-0 h-3">
                ✓
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="truncate max-w-[60px]">{recentSales[0].seller_name}</span>
                <span>{recentSales[0].coins_for_sale.toLocaleString()}</span>
                <span>KSH {recentSales[0].price_per_coin}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketplacePanel;