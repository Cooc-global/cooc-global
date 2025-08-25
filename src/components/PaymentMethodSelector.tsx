import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, CreditCard, Phone, Building2, Wallet, Smartphone } from 'lucide-react';
import { PaymentMethod } from '@/hooks/useMarketplace';

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  onPaymentMethodsChange: (methods: PaymentMethod[]) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phone: string) => void;
}

const PAYMENT_TYPES = [
  { value: 'phone', label: 'Phone/M-Pesa', icon: Phone, placeholder: '+254 XXX XXX XXX' },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, placeholder: 'Service: Number' },
  { value: 'bank', label: 'Bank Transfer', icon: Building2, placeholder: 'Bank: Account Number' },
  { value: 'paypal', label: 'PayPal', icon: CreditCard, placeholder: 'PayPal email address' },
  { value: 'crypto', label: 'Crypto Wallet', icon: Wallet, placeholder: 'Wallet address (USDT, BTC, etc.)' }
] as const;

const PaymentMethodSelector = ({ 
  paymentMethods, 
  onPaymentMethodsChange, 
  phoneNumber, 
  onPhoneNumberChange 
}: PaymentMethodSelectorProps) => {
  const [newMethodType, setNewMethodType] = useState<string>('');
  const [newMethodDetails, setNewMethodDetails] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const addPaymentMethod = () => {
    if (!newMethodType || !newMethodDetails.trim()) return;

    const selectedType = PAYMENT_TYPES.find(t => t.value === newMethodType);
    if (!selectedType) return;

    const newMethod: PaymentMethod = {
      type: newMethodType as PaymentMethod['type'],
      details: newMethodDetails.trim(),
      label: selectedType.label
    };

    onPaymentMethodsChange([...paymentMethods, newMethod]);
    setNewMethodType('');
    setNewMethodDetails('');
    setShowAddForm(false);
  };

  const removePaymentMethod = (index: number) => {
    const updated = paymentMethods.filter((_, i) => i !== index);
    onPaymentMethodsChange(updated);
  };

  const getMethodIcon = (type: PaymentMethod['type']) => {
    const methodType = PAYMENT_TYPES.find(t => t.value === type);
    const IconComponent = methodType?.icon || CreditCard;
    return <IconComponent className="w-4 h-4" />;
  };

  const selectedPlaceholder = newMethodType ? 
    PAYMENT_TYPES.find(t => t.value === newMethodType)?.placeholder || 'Enter details' : 
    'Enter payment details';

  return (
    <div className="space-y-3">
      {/* Phone Number - M-Pesa & Contact */}
      <div>
        <Label htmlFor="phoneNumber" className="text-xs">Phone Number (M-Pesa & Contact) *</Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="+254 XXX XXX XXX"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          className="h-8 text-sm"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          This number will be used for both M-Pesa payments and direct contact.
        </p>
      </div>

      {/* Payment Methods */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Payment Methods</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Method
          </Button>
        </div>

        {/* Existing Payment Methods */}
        <div className="space-y-2 mb-2">
          {paymentMethods.map((method, index) => (
            <div key={index} className="flex items-center justify-between bg-muted/50 rounded p-2">
              <div className="flex items-center gap-2 flex-1">
                {getMethodIcon(method.type)}
                <div className="flex-1">
                  <div className="text-xs font-medium">{method.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{method.details}</div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePaymentMethod(index)}
                className="h-6 w-6 p-0 text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Method Form */}
        {showAddForm && (
          <Card className="border-dashed">
            <CardContent className="pt-3 pb-3">
              <div className="space-y-2">
                <Select value={newMethodType} onValueChange={setNewMethodType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder={selectedPlaceholder}
                  value={newMethodDetails}
                  onChange={(e) => setNewMethodDetails(e.target.value)}
                  className="h-8 text-sm"
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={addPaymentMethod}
                    size="sm"
                    className="h-7 px-3 text-xs flex-1"
                    disabled={!newMethodType || !newMethodDetails.trim()}
                  >
                    Add Method
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    size="sm"
                    className="h-7 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentMethods.length === 0 && !phoneNumber.trim() && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 text-center">
            Phone number is required for M-Pesa payments and contact
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
