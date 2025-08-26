import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCLCPrice } from '@/hooks/useCLCPrice';
import clcLogo from '@/assets/clc-coin-logo.png';

interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}

const PriceTicker = () => {
  const { priceData: clcPrice, loading } = useCLCPrice();
  const [clcDisplayPrice, setClcDisplayPrice] = useState(clcPrice.price);
  const [otherCoins, setOtherCoins] = useState<TickerData[]>([
    { symbol: 'BTC', price: 67420.50, change: -1250.30, changePercent: -1.82, currency: 'USD' },
    { symbol: 'ETH', price: 3845.75, change: 125.40, changePercent: 3.37, currency: 'USD' },
    { symbol: 'BNB', price: 542.30, change: 18.90, changePercent: 3.61, currency: 'USD' },
  ]);

  // Update CLC display price with attractive fluctuations
  const clcData: TickerData = {
    symbol: 'CLC',
    price: clcDisplayPrice,
    change: clcDisplayPrice - clcPrice.price,
    changePercent: ((clcDisplayPrice - clcPrice.price) / clcPrice.price) * 100,
    currency: 'KSH'
  };

  const tickerData = [clcData, ...otherCoins];

  useEffect(() => {
    // Update display price when real CLC price changes
    setClcDisplayPrice(clcPrice.price);
  }, [clcPrice.price]);

  useEffect(() => {
    // Add attractive fluctuations to CLC price and simulate changes for other coins
    const interval = setInterval(() => {
      // Update CLC with small attractive fluctuations (±0.5% to ±2%)
      setClcDisplayPrice(prev => {
        const basePrice = clcPrice.price;
        const fluctuation = (Math.random() - 0.5) * 0.04; // ±2% max
        const minFluctuation = Math.sign(fluctuation) * 0.005; // ±0.5% min
        const finalFluctuation = Math.abs(fluctuation) < 0.005 ? minFluctuation : fluctuation;
        return basePrice * (1 + finalFluctuation);
      });

      // Update other coins
      setOtherCoins(prev => prev.map(item => {
        const randomChange = (Math.random() - 0.5) * 0.02;
        const newPrice = item.price * (1 + randomChange);
        const change = newPrice - item.price;
        const changePercent = (change / item.price) * 100;
        
        return {
          ...item,
          price: newPrice,
          change,
          changePercent
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [clcPrice.price]);

  return (
    <Card className="mb-6 bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {tickerData.map((item, index) => (
            <div key={item.symbol} className={`flex items-center space-x-2 ${index > 0 ? 'hidden sm:flex' : ''}`}>
              {item.symbol === 'CLC' && (
                <img src={clcLogo} alt="CLC Coin" className="w-5 h-5" />
              )}
              <div className="text-sm font-medium text-foreground">
                {item.symbol}
              </div>
              <div className="text-sm font-bold">
                {item.currency === 'KSH' ? 'KSH ' : '$'}{item.price.toLocaleString(undefined, { 
                  minimumFractionDigits: item.symbol === 'CLC' ? 2 : 2,
                  maximumFractionDigits: item.symbol === 'CLC' ? 2 : 2
                })}
              </div>
              <div className={`flex items-center text-xs ${
                item.changePercent >= 0 ? 'text-crypto-green' : 'text-destructive'
              }`}>
                {item.changePercent >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceTicker;