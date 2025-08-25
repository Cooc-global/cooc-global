-- Add payment methods support to marketplace table
ALTER TABLE public.marketplace 
ADD COLUMN payment_methods JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the payment_methods structure
COMMENT ON COLUMN public.marketplace.payment_methods IS 'Array of payment method objects with type, details, and display info';

-- Example structure for payment_methods:
-- [
--   {"type": "phone", "details": "+254123456789", "label": "M-Pesa"},
--   {"type": "bank", "details": "Account: 1234567890, Bank: KCB", "label": "Bank Transfer"},
--   {"type": "paypal", "details": "user@email.com", "label": "PayPal"},
--   {"type": "crypto", "details": "0x1234...5678", "label": "USDT (ERC-20)"}
-- ]