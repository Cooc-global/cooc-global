-- Insert 100 fictional sold marketplace offers with Kenyan names and M-Pesa numbers
DO $$
DECLARE
    dev_user_id UUID;
    kenyan_names TEXT[] := ARRAY[
        'John Mwangi', 'Mary Wanjiku', 'Peter Kipchoge', 'Grace Achieng', 'David Mutua',
        'Sarah Njeri', 'James Kiprotich', 'Anne Waweru', 'Michael Ochieng', 'Lucy Nyong''o',
        'Samuel Kiptoo', 'Faith Wanjiru', 'Daniel Maina', 'Joyce Akinyi', 'Joseph Kiplagat',
        'Margaret Wairimu', 'Francis Otieno', 'Catherine Chebet', 'Anthony Kamau', 'Esther Wangari',
        'Robert Koech', 'Mercy Gathoni', 'Charles Njuguna', 'Beatrice Moraa', 'Paul Kibet',
        'Agnes Mumbi', 'Simon Wanyama', 'Rose Kerubo', 'Isaac Rotich', 'Helen Nyambura',
        'Moses Langat', 'Jane Muthoni', 'George Macharia', 'Lydia Awuor', 'Benjamin Too',
        'Priscilla Wambui', 'Nicholas Biwott', 'Christine Adhiambo', 'Patrick Kemboi', 'Winnie Njoki',
        'Eric Chelimo', 'Susan Wamuyu', 'Alfred Kosgei', 'Gladys Wacuka', 'Timothy Ruto',
        'Diana Wanjira', 'Kevin Sang', 'Violet Nyokabi', 'Victor Kimani', 'Caroline Chepng''etich',
        'Brian Kipchumba', 'Nancy Kagendo', 'Edwin Cheruiyot', 'Elizabeth Wangui', 'Collins Tanui',
        'Alice Wambura', 'Dennis Kiptanui', 'Purity Nyawira', 'Henry Lagat', 'Martha Mwikali',
        'Geoffrey Kirui', 'Teresa Wanjala', 'Abraham Kiprono', 'Eunice Wairimu', 'Kenneth Kiprop',
        'Rebecca Wangeci', 'Richard Cherono', 'Stella Auma', 'Felix Kiprotich', 'Ruth Wachuka',
        'Alex Kiptoo', 'Millicent Njambi', 'William Korir', 'Florence Wangari', 'Lawrence Kimutai',
        'Peris Wamuyu', 'Stanley Chebet', 'Monica Wanjiru', 'Thomas Kipkemboi', 'Lilian Wairimu',
        'Joshua Rono', 'Josephine Nyambura', 'Emmanuel Kiptanui', 'Doreen Wacuka', 'Solomon Kibet',
        'Irene Wangui', 'Andrew Too', 'Janet Wambui', 'Noah Koech', 'Tabitha Nyokabi',
        'Luke Kiplagat', 'Edith Wamuyu', 'Mark Rotich', 'Patricia Wanjiku', 'Elijah Sang',
        'Philomena Gathoni', 'Caleb Cheruiyot', 'Veronica Njeri', 'Isaac Langat', 'Brenda Waweru'
    ];
    phone_prefixes TEXT[] := ARRAY['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', '0711', '0712', '0713', '0714', '0715', '0716', '0717', '0718', '0719', '0720', '0721', '0722', '0723', '0724', '0725', '0726', '0727', '0728', '0729'];
    i INTEGER;
    random_name TEXT;
    random_phone TEXT;
    random_coins NUMERIC;
    random_price NUMERIC;
    random_days INTEGER;
BEGIN
    -- Get developer user ID
    SELECT user_id INTO dev_user_id FROM public.profiles WHERE role = 'developer' LIMIT 1;
    
    -- Insert 100 fictional sold offers
    FOR i IN 1..100 LOOP
        -- Select random name
        random_name := kenyan_names[1 + (random() * (array_length(kenyan_names, 1) - 1))::int];
        
        -- Generate random phone number
        random_phone := phone_prefixes[1 + (random() * (array_length(phone_prefixes, 1) - 1))::int] || 
                       lpad((100000 + (random() * 899999)::int)::text, 6, '0');
        
        -- Generate random coin amount (500 - 50000)
        random_coins := 500 + (random() * 49500)::int;
        
        -- Generate random price (8.50 - 15.00 KSH)
        random_price := 8.50 + (random() * 6.50);
        random_price := round(random_price * 100) / 100; -- Round to 2 decimal places
        
        -- Random days ago (1-90 days)
        random_days := 1 + (random() * 89)::int;
        
        INSERT INTO public.marketplace (
            user_id,
            seller_name,
            phone_number,
            coins_for_sale,
            price_per_coin,
            currency,
            status,
            payment_methods,
            created_at,
            updated_at
        ) VALUES (
            dev_user_id,
            random_name,
            random_phone,
            random_coins,
            random_price,
            'KSH',
            'sold',
            jsonb_build_array(
                jsonb_build_object(
                    'type', 'phone',
                    'details', random_phone,
                    'label', 'M-Pesa'
                )
            ),
            now() - (random_days || ' days')::interval,
            now() - (random_days || ' days')::interval
        );
    END LOOP;
    
    RAISE NOTICE '100 fictional sold marketplace offers created successfully';
END $$;