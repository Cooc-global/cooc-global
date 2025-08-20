import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const PriceTicker = () => {
  const [tickerData, setTickerData] = useState<TickerData[]>([
    { symbol: 'CLC', price: 0.85, change: 0.05, changePercent: 6.25 },
    { symbol: 'BTC', price: 67420.50, change: -1250.30, changePercent: -1.82 },
    { symbol: 'ETH', price: 3845.75, change: 125.40, changePercent: 3.37 },
    { symbol: 'BNB', price: 542.30, change: 18.90, changePercent: 3.61 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(item => {
        const randomChange = (Math.random() - 0.5) * 0.02; // Random change between -1% to +1%
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
  }, []);

  return (
    <Card className="mb-6 bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {tickerData.map((item, index) => (
            <div key={item.symbol} className={`flex items-center space-x-2 ${index > 0 ? 'hidden sm:flex' : ''}`}>
              <div className="text-sm font-medium text-foreground">
                {item.symbol}
              </div>
              <div className="text-sm font-bold">
                ${item.price.toLocaleString(undefined, { 
                  minimumFractionDigits: item.symbol === 'CLC' ? 4 : 2,
                  maximumFractionDigits: item.symbol === 'CLC' ? 4 : 2
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