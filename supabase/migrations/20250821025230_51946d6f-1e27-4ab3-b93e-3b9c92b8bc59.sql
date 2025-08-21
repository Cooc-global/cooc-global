-- Create 100 fictional Kenyan marketplace users with sold status
DO $$
DECLARE
    kenyan_names TEXT[] := ARRAY[
        'Grace Wanjiku', 'James Kiprotich', 'Mary Akinyi', 'Peter Mwangi', 'Faith Nyokabi',
        'Samuel Kipchoge', 'Susan Wambui', 'David Ochieng', 'Jane Wairimu', 'Joseph Kimani',
        'Rose Njeri', 'Michael Otieno', 'Catherine Muthoni', 'John Kamau', 'Margaret Chebet',
        'Daniel Karanja', 'Lucy Wangari', 'Francis Mutua', 'Joyce Auma', 'Paul Kiptoo',
        'Agnes Nyambura', 'Simon Kibet', 'Rebecca Wanjiru', 'George Omondi', 'Esther Wanjala',
        'Vincent Koech', 'Nancy Gathoni', 'Robert Macharia', 'Elizabeth Kemunto', 'Anthony Kiplagat',
        'Caroline Githiomi', 'Stephen Maina', 'Mercy Akoth', 'Charles Ndung''u', 'Lydia Chepkemoi',
        'Evans Kiprotich', 'Helen Mwikali', 'Benjamin Rotich', 'Sarah Waithera', 'Isaac Bett',
        'Priscilla Wawira', 'Moses Kemboi', 'Anne Wangui', 'Timothy Njoroge', 'Gladys Chemutai',
        'Andrew Kiprono', 'Ruth Mukami', 'Collins Ouma', 'Eunice Wachira', 'Brian Lagat',
        'Tabitha Njoki', 'Felix Chirchir', 'Winnie Nyawira', 'Edwin Too', 'Christine Mwende',
        'Harrison Ruto', 'Beatrice Wanja', 'Kennedy Cheruiyot', 'Violet Njambi', 'Nicholas Sang',
        'Phoebe Karimi', 'Lawrence Kones', 'Stella Wahome', 'Albert Korir', 'Martha Chepkurui',
        'Emmanuel Tanui', 'Doris Wamuyu', 'Gilbert Rotich', 'Josephine Njuguna', 'Oliver Kipchumba',
        'Millicent Wambugu', 'Dennis Kipkemboi', 'Patricia Wanjala', 'Victor Chebet', 'Alice Gathiru',
        'Alfred Kiplimo', 'Clara Mwanzia', 'Wesley Kiprop', 'Rosemary Waweru', 'Philip Kipchirchir',
        'Veronica Nyokabi', 'Douglas Kipruto', 'Florence Wairimu', 'Geoffrey Kiptanui', 'Hellen Mwikali',
        'Jackson Rotich', 'Monica Wanjiku', 'Ronald Kiplagat', 'Edith Wanjiru', 'Duncan Koech',
        'Naomi Gathoni', 'Arnold Kiprotich', 'Pauline Muthoni', 'Gerald Too', 'Jacinta Waithera',
        'Samson Kipchoge', 'Bridget Njeri', 'Kelvin Ruto', 'Dorcas Wangari', 'Ivan Kemboi'
    ];
    
    safaricom_prefixes TEXT[] := ARRAY['0700', '0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', '0710', '0711', '0712', '0713', '0714', '0715', '0716', '0717', '0718', '0719', '0720', '0721', '0722', '0723', '0724', '0725', '0726', '0727', '0728', '0729'];
    
    coin_amounts NUMERIC[] := ARRAY[50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 750, 800, 900, 1000, 1200, 1500, 2000, 2500];
    
    price_per_coin NUMERIC[] := ARRAY[0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25];
    
    i INTEGER;
    random_name TEXT;
    random_phone TEXT;
    random_coins NUMERIC;
    random_price NUMERIC;
    random_days INTEGER;
    fake_user_id UUID;
BEGIN
    FOR i IN 1..100 LOOP
        -- Generate fake user ID
        fake_user_id := gen_random_uuid();
        
        -- Select random values
        random_name := kenyan_names[1 + (random() * (array_length(kenyan_names, 1) - 1))::INTEGER];
        random_phone := '+254 ' || safaricom_prefixes[1 + (random() * (array_length(safaricom_prefixes, 1) - 1))::INTEGER] || ' ' || 
                       lpad((100000 + random() * 899999)::INTEGER::TEXT, 6, '0');
        random_coins := coin_amounts[1 + (random() * (array_length(coin_amounts, 1) - 1))::INTEGER];
        random_price := price_per_coin[1 + (random() * (array_length(price_per_coin, 1) - 1))::INTEGER];
        random_days := (random() * 30)::INTEGER; -- Random days within last 30 days
        
        INSERT INTO public.marketplace (
            user_id,
            seller_name,
            phone_number,
            coins_for_sale,
            price_per_coin,
            description,
            status,
            created_at,
            updated_at
        ) VALUES (
            fake_user_id,
            random_name,
            random_phone,
            random_coins,
            random_price,
            'High-quality CLC coins available for immediate transfer. Verified seller with excellent transaction history.',
            'sold',
            now() - (random_days || ' days')::INTERVAL,
            now() - (random_days || ' days')::INTERVAL
        );
    END LOOP;
END $$;