import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useCLCPrice } from '@/hooks/useCLCPrice';
import { useCurrency } from '@/hooks/useCurrency';
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
  const { formatCurrency } = useCurrency();
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
      currency: 'KSH',
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
    <Card className="w-full bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2 px-4 pt-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm font-semibold text-primary animate-fade-in">
            <ShoppingCart className="w-4 h-4 mr-2 text-primary animate-pulse" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sell Coins
            </span>
            <Badge variant="secondary" className="ml-2 text-xs px-2 py-1 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 animate-scale-in">
              {activeOffers.length}
            </Badge>
          </CardTitle>
          <Button 
            variant="default"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="h-8 px-3 text-xs bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 animate-fade-in"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4 pt-2">
        {showForm && (
          <div className="border rounded-lg p-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 mb-3 animate-fade-in">
            <form onSubmit={handleCreateOffer} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Coins to sell"
                  value={coinsToSell}
                  onChange={(e) => setCoinsToSell(e.target.value)}
                  className="h-8 text-sm flex-1 border-primary/20 focus:border-primary transition-colors"
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  min="10.00"
                  placeholder={`Price per coin (Min: 10.00)`}
                  value={pricePerCoin}
                  onChange={(e) => setPricePerCoin(e.target.value)}
                  className="h-8 text-sm flex-1 border-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>
              <Input
                type="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-8 text-sm border-primary/20 focus:border-primary transition-colors"
                required
              />
              <Button 
                type="submit" 
                className="w-full h-8 text-sm bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200" 
                disabled={loading}
              >
                {loading ? 'Creating Offer...' : 'Create Offer'}
              </Button>
            </form>
          </div>
        )}

        {/* Compact Active Offers */}
        <div className="space-y-2">
          {activeOffers.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Active Offers</span>
                {activeOffers.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 px-2 hover:bg-primary/10 text-primary"
                  >
                    {isExpanded ? 
                      <ChevronUp className="w-3 h-3" /> : 
                      <ChevronDown className="w-3 h-3" />
                    }
                  </Button>
                )}
              </div>
              
              {/* First offer always visible */}
              <div className="border rounded-lg p-3 bg-gradient-to-r from-card to-secondary/5 border-primary/20 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                    {activeOffers[0].seller_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {activeOffers[0].user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOffer(activeOffers[0].id)}
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:scale-110 transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {user && activeOffers[0].phone_number && (
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Phone className="w-3 h-3 mr-1 text-primary" />
                    <span className="truncate">
                      {displayPhoneNumber(activeOffers[0])}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-primary">{activeOffers[0].coins_for_sale.toLocaleString()} CLC</span>
                  <span className="text-secondary">{formatCurrency(activeOffers[0].price_per_coin, activeOffers[0].currency)}</span>
                  <span className="text-accent font-semibold">{formatCurrency(activeOffers[0].coins_for_sale * activeOffers[0].price_per_coin, activeOffers[0].currency)}</span>
                </div>
              </div>
              
              {/* Additional offers - collapsible */}
              {activeOffers.length > 1 && (
                <Collapsible open={isExpanded}>
                  <CollapsibleContent>
                    {activeOffers.slice(1, 3).map((offer) => (
                      <div key={offer.id} className="border rounded-lg p-3 bg-gradient-to-r from-card to-secondary/5 border-primary/20 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                            {offer.seller_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            {offer.user_id === user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:scale-110 transition-all duration-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-primary">{offer.coins_for_sale.toLocaleString()} CLC</span>
                          <span className="text-secondary">{formatCurrency(offer.price_per_coin, offer.currency)}</span>
                          <span className="text-accent font-semibold">{formatCurrency(offer.coins_for_sale * offer.price_per_coin, offer.currency)}</span>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
          
          {activeOffers.length === 0 && (
            <div className="text-center py-4 animate-fade-in">
              <span className="text-sm text-muted-foreground">No active offers yet</span>
            </div>
          )}
        </div>

        {/* Recent Sales - Enhanced */}
        {recentSales.length > 0 && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Recent Sales</span>
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30 text-green-700">
                ✓ Sold
              </Badge>
            </div>
            <div className="bg-gradient-to-r from-green-50/50 to-green-100/50 border border-green-200/50 rounded-lg p-2 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="truncate max-w-[80px] font-medium text-foreground">{recentSales[0].seller_name}</span>
                <span className="text-primary">{recentSales[0].coins_for_sale.toLocaleString()} CLC</span>
                <span className="text-accent font-semibold">{formatCurrency(recentSales[0].price_per_coin, recentSales[0].currency)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketplacePanel;