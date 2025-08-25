import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/useCurrency';
import { ArrowRightLeft, Calculator } from 'lucide-react';

interface CurrencyConverterProps {
  className?: string;
}

const CurrencyConverter = ({ className }: CurrencyConverterProps) => {
  const { convertCurrency, formatCurrency, supportedCurrencies } = useCurrency();
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('KSH');

  const convertedAmount = parseFloat(amount) ? 
    convertCurrency(parseFloat(amount), fromCurrency, toCurrency) : 0;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm">
          <Calculator className="w-4 h-4 mr-2" />
          Currency Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="h-8 text-sm"
            />
          </div>
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              {supportedCurrencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-1">
                    <span>{currency.flag}</span>
                    <span>{currency.code}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={swapCurrencies}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowRightLeft className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="h-8 px-3 py-2 bg-muted rounded-md text-sm font-medium">
              {convertedAmount.toLocaleString(undefined, {
                minimumFractionDigits: ['UGX', 'TZS', 'NGN'].includes(toCurrency) ? 0 : 2,
                maximumFractionDigits: ['UGX', 'TZS', 'NGN'].includes(toCurrency) ? 0 : 2
              })}
            </div>
          </div>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              {supportedCurrencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-1">
                    <span>{currency.flag}</span>
                    <span>{currency.code}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {parseFloat(amount) && (
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              {formatCurrency(parseFloat(amount), fromCurrency)} = {formatCurrency(convertedAmount, toCurrency)}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrencyConverter;