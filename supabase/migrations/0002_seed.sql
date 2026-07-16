-- =========================================================================
-- Jack & Jill — Seed Data
-- =========================================================================

-- Age groups
insert into public.age_groups (label, slug, sort_order) values
  ('0-12 Months', '0-12m', 1),
  ('1-2 Years',   '1-2y',  2),
  ('2-4 Years',   '2-4y',  3),
  ('4-6 Years',   '4-6y',  4),
  ('6-8 Years',   '6-8y',  5),
  ('8-10 Years',  '8-10y', 6),
  ('10+ Years',   '10y-plus', 7)
on conflict (slug) do nothing;

-- Top-level categories
insert into public.categories (name, slug, image_url, is_featured_in_menu, sort_order) values
  ('Clothing',           'clothing',           'https://images.unsplash.com/photo-1529776292731-c2246c65df5a?w=600', true, 1),
  ('Footwear',           'footwear',           'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600', true, 2),
  ('Baby Essentials',    'baby-essentials',    'https://images.unsplash.com/photo-1768693602418-260d828b878d?w=600', true, 3),
  ('Bags',               'bags',               'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', true, 4),
  ('School Accessories', 'school-accessories', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600', true, 5),
  ('Toys',               'toys',               'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600', true, 6),
  ('Gift Hampers',       'gift-hampers',       'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600', true, 7)
on conflict (slug) do nothing;

-- Subcategories
do $$
declare
  clothing_id uuid;
  baby_id uuid;
  bags_id uuid;
  toys_id uuid;
begin
  select id into clothing_id from public.categories where slug = 'clothing';
  select id into baby_id from public.categories where slug = 'baby-essentials';
  select id into bags_id from public.categories where slug = 'bags';
  select id into toys_id from public.categories where slug = 'toys';

  insert into public.categories (parent_id, name, slug, sort_order) values
    (clothing_id, 'Girls Collection',   'girls-collection', 1),
    (clothing_id, 'Summer Wear',        'summer-wear', 2),
    (clothing_id, 'Fashion Accessories','fashion-accessories', 3),
    (baby_id, 'Feeding Bottles',        'feeding-bottles', 1),
    (baby_id, 'Sippers',                'sippers', 2),
    (baby_id, 'Blankets',               'blankets', 3),
    (baby_id, 'Swaddles',               'swaddles', 4),
    (baby_id, 'Baby Care',              'baby-care', 5),
    (baby_id, 'Teethers',               'teethers', 6),
    (baby_id, 'Baby Carriers',          'baby-carriers', 7),
    (baby_id, 'Tumblers',               'tumblers', 8),
    (baby_id, 'Hygiene',                'hygiene', 9),
    (bags_id, 'School Bags',            'school-bags', 1),
    (bags_id, 'Kids Bags',              'kids-bags', 2),
    (toys_id, 'RC Toys',                'rc-toys', 1),
    (toys_id, 'Educational Toys',       'educational-toys', 2),
    (toys_id, 'Music Toys',             'music-toys', 3),
    (toys_id, 'Teddy',                  'teddy', 4)
  on conflict (slug) do nothing;
end $$;

-- Trust badges
insert into public.trust_badges (icon, label, subtext, sort_order) values
  ('Award',       '22 Years of Trust',    'Since 2003',           1),
  ('Users',       '10,000+ Families',     'Loved across India',   2),
  ('ShieldCheck', 'Skin-Safe Quality',    'Tested & certified',   3),
  ('Truck',       'Free Shipping',        'On orders above ₹999', 4),
  ('RotateCcw',   'Easy Returns',         '7-day return policy',  5),
  ('Lock',        'Secure Payment',       '100% safe checkout',   6),
  ('RefreshCw',   'Instant Replacement',  'For damaged items',    7),
  ('Sparkles',    '500+ Styles',          'Newborn to teens',     8)
on conflict do nothing;

-- Homepage sections (default order)
insert into public.homepage_sections (section_type, title, subtitle, config, sort_order) values
  ('hero', 'Tiny Steps, Big Smiles', 'Style • Comfort • Care — for every little one', '{"slides":[{"image":"https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1600","cta_text":"Shop New Arrivals","cta_link":"/shop?sort=newest","heading":"22 Years of Making Parenting Simpler","subheading":"From newborn cuddles to teen adventures"}]}', 1),
  ('instagram_reels', 'From Our Instagram', '@jacknjill_kolhapur', '{"urls":[]}', 2),
  ('categories', 'Shop by Category', 'Curated for every little moment', '{"shape":"circle"}', 3),
  ('product_shelf', 'Most Loved', 'Bestsellers from our community', '{"filter":"featured","limit":8}', 4),
  ('brand_story', 'The Jack & Jill Story', 'Kolhapur''s trusted kids brand since 2003', '{"image":"https://images.unsplash.com/photo-1715433493252-0bc747ea78be?w=1200"}', 5),
  ('product_shelf', 'New Arrivals', 'Freshly landed styles', '{"filter":"new_arrivals","limit":8}', 6),
  ('parents_reviews', 'Real Parents, Real Stories', 'What families say about us', '{"videos":[]}', 7),
  ('trust_badges', 'Why Families Choose Us', '', '{}', 8);

-- CMS pages
insert into public.cms_pages (slug, title, content, meta_title, meta_description) values
  ('about',      'About Jack & Jill', 'Founded in 2003 by Ajit Mehta in Kolhapur, Maharashtra, Jack & Jill has grown from a single flagship store into a beloved premium kids lifestyle brand serving over 10,000 families across India. We specialise in quality clothing, footwear, baby essentials, toys and gift hampers for children from newborn to teens.', 'About Jack & Jill — 22 Years of Premium Kids Fashion in Kolhapur', 'Discover the story of Jack & Jill, a Kolhapur-based kids fashion & baby essentials brand founded in 2003 by Ajit Mehta.'),
  ('privacy',    'Privacy Policy', 'We respect your privacy. This policy explains what data we collect (name, email, phone, address, order history), how we use it (to fulfil your orders and communicate with you), and your rights (access, correction, deletion). We never sell your data. For any privacy request, email privacy@jacknjillkids.com.', 'Privacy Policy — Jack & Jill', 'How Jack & Jill collects, uses and protects your personal information.'),
  ('terms',      'Terms & Conditions', 'By using jacknjillkids.com you agree to our terms: (1) prices are in INR and inclusive of GST unless noted, (2) orders are confirmed only after successful payment, (3) all products are for the intended age group as labelled, (4) misuse of coupons/promotions may result in cancellation.', 'Terms & Conditions — Jack & Jill', 'Terms of service for shopping at Jack & Jill.'),
  ('shipping',   'Shipping Policy', 'We ship pan-India via trusted courier partners. Orders above ₹999 ship free; below that, a flat ₹79 shipping fee applies. Delivery timelines: 3–5 business days in metros, 5–7 business days elsewhere. COD is available for eligible pincodes.', 'Shipping Policy — Jack & Jill', 'Shipping charges, timelines and COD availability at Jack & Jill.'),
  ('returns',    'Return Policy', 'You may return unused items in original packaging within 7 days of delivery. Innerwear, feeding bottles, teethers and personal-care items are non-returnable for hygiene reasons. Refunds are issued to the original payment method within 5–7 business days of return receipt.', 'Return Policy — Jack & Jill', '7-day easy returns on eligible items at Jack & Jill.'),
  ('refund',     'Refund Policy', 'Refunds for prepaid orders are processed to the original payment method within 5–7 business days after return QC. For COD orders, refunds are issued via bank transfer — please share your account details with our support team.', 'Refund Policy — Jack & Jill', 'How refunds work at Jack & Jill.'),
  ('cancellation','Cancellation Policy', 'Orders can be cancelled free of cost until they are marked "Packed". Once shipped, cancellation is not possible but you may refuse delivery or initiate a return after receipt.', 'Cancellation Policy — Jack & Jill', 'Order cancellation rules at Jack & Jill.')
on conflict (slug) do nothing;

-- FAQs (for FAQPage schema)
insert into public.faqs (question, answer, page_context, sort_order) values
  ('What age groups does Jack & Jill cater to?', 'We serve children from 0-12 months up to 10+ years, across clothing, footwear, baby essentials, bags, school accessories, toys and gift hampers.', 'general', 1),
  ('Is Jack & Jill a physical store or only online?', 'Both. Our flagship store is in Shahupuri, Kolhapur (Maharashtra), and we ship pan-India through jacknjillkids.com.', 'general', 2),
  ('Are your products safe for babies?', 'Yes — all our baby essentials are tested for skin safety and meet Indian quality standards. Look for the "Skin-Safe" badge on eligible products.', 'general', 3),
  ('What is your return policy?', 'Unused items in original packaging can be returned within 7 days. Hygiene items (innerwear, bottles, teethers) are non-returnable.', 'general', 4),
  ('Do you offer Cash on Delivery?', 'Yes, COD is available for eligible pincodes. Enter your pincode at checkout to check availability.', 'general', 5),
  ('When will I get free shipping?', 'Orders above ₹999 ship free anywhere in India. Below that, a flat ₹79 shipping charge applies.', 'general', 6),
  ('How can I track my order?', 'Visit the Track Order page and enter your order number plus registered email or phone. Logged-in customers can also see live status in "My Orders".', 'general', 7);

-- Serviceable pincodes (Kolhapur + major Indian metros as seed)
insert into public.pincodes (pincode, city, state, is_serviceable, cod_available, est_delivery_days) values
  ('416001','Kolhapur','Maharashtra',true,true,2),
  ('416003','Kolhapur','Maharashtra',true,true,2),
  ('411001','Pune','Maharashtra',true,true,3),
  ('400001','Mumbai','Maharashtra',true,true,3),
  ('110001','New Delhi','Delhi',true,true,5),
  ('560001','Bengaluru','Karnataka',true,true,5),
  ('600001','Chennai','Tamil Nadu',true,true,5),
  ('700001','Kolkata','West Bengal',true,true,6),
  ('500001','Hyderabad','Telangana',true,true,5),
  ('380001','Ahmedabad','Gujarat',true,true,5)
on conflict (pincode) do nothing;

-- Settings
insert into public.settings (key, value) values
  ('shipping', '{"free_above": 999, "flat_fee": 79, "gst_percent": 5}'),
  ('trust_stats', '{"years": 22, "families": "10,000+", "styles": "500+"}'),
  ('contact_info', '{"phone":"+91 83299 84160","email":"hello@jacknjillkids.com","address":"Opp. Shahji Law College, E Ward, Shahupuri, Kolhapur, Maharashtra 416001","hours":"Mon–Sun, 10am–9pm"}'),
  ('brand', '{"name":"Jack & Jill","tagline":"Making Parenting Simpler","instagram":"https://instagram.com/jacknjill_kolhapur","facebook":"https://facebook.com/JACKNJILLKOLHAPUR"}'),
  ('razorpay', '{"key_id":"","key_secret":"","webhook_secret":"","enabled":false}'),
  ('cod', '{"enabled": true}')
on conflict (key) do update set value = excluded.value;

-- Sample products (10) — real image swap-in later
do $$
declare
  clothing_id uuid;
  footwear_id uuid;
  toys_id uuid;
  baby_id uuid;
  bags_id uuid;
  age_1_2 uuid; age_2_4 uuid; age_4_6 uuid; age_6_8 uuid;
  p_id uuid;
begin
  select id into clothing_id from public.categories where slug='clothing';
  select id into footwear_id from public.categories where slug='footwear';
  select id into toys_id     from public.categories where slug='toys';
  select id into baby_id     from public.categories where slug='baby-essentials';
  select id into bags_id     from public.categories where slug='bags';
  select id into age_1_2 from public.age_groups where slug='1-2y';
  select id into age_2_4 from public.age_groups where slug='2-4y';
  select id into age_4_6 from public.age_groups where slug='4-6y';
  select id into age_6_8 from public.age_groups where slug='6-8y';

  -- Product 1
  insert into public.products (name, slug, description, short_description, category_id, gender, base_price, mrp, is_featured, is_new_arrival, alt_text)
  values ('Sunshine Cotton Frock', 'sunshine-cotton-frock',
    'A breezy summer frock in 100% organic cotton with hand-embroidered floral motifs. Skin-safe dyes, elasticated waist, comfortable all-day wear.',
    '100% cotton • Skin-safe • Hand-embroidered',
    clothing_id, 'girls', 899, 1299, true, true, 'Yellow floral summer frock for girls')
  returning id into p_id;
  insert into public.product_images (product_id, url, alt_text, sort_order) values
    (p_id, 'https://images.unsplash.com/photo-1524183551017-8ca23bb63e8f?w=1000', 'Sunshine Cotton Frock front', 0),
    (p_id, 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1000', 'Sunshine Cotton Frock side', 1);
  insert into public.product_variants (product_id, size, color, color_hex, sku, stock_qty) values
    (p_id, '1-2Y', 'Yellow', '#F7D34C', 'SCF-1-Y', 12),
    (p_id, '2-4Y', 'Yellow', '#F7D34C', 'SCF-2-Y', 15),
    (p_id, '4-6Y', 'Yellow', '#F7D34C', 'SCF-4-Y', 8),
    (p_id, '2-4Y', 'Blush', '#FDEEF0', 'SCF-2-B', 10);
  insert into public.product_age_groups values (p_id, age_1_2),(p_id, age_2_4),(p_id, age_4_6);

  -- Product 2
  insert into public.products (name, slug, description, short_description, category_id, gender, base_price, mrp, is_featured, is_new_arrival, alt_text)
  values ('Little Explorer Sneakers', 'little-explorer-sneakers',
    'Lightweight anti-slip sneakers with cushioned insole and easy velcro closure. Perfect for playground adventures.',
    'Anti-slip • Velcro closure • Cushioned',
    footwear_id, 'unisex', 1199, 1599, true, false, 'Blue kids sneakers with velcro')
  returning id into p_id;
  insert into public.product_images (product_id, url, alt_text, sort_order) values
    (p_id, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1000', 'Little Explorer Sneakers', 0),
    (p_id, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000', 'Little Explorer Sneakers pair', 1);
  insert into public.product_variants (product_id, size, color, color_hex, sku, stock_qty) values
    (p_id, 'EU 24', 'Sky Blue', '#EAF4FB', 'LES-24-SB', 6),
    (p_id, 'EU 26', 'Sky Blue', '#EAF4FB', 'LES-26-SB', 9),
    (p_id, 'EU 28', 'Navy', '#1E2A4A', 'LES-28-N', 5),
    (p_id, 'EU 30', 'Navy', '#1E2A4A', 'LES-30-N', 4);
  insert into public.product_age_groups values (p_id, age_2_4),(p_id, age_4_6),(p_id, age_6_8);

  -- Product 3
  insert into public.products (name, slug, description, short_description, category_id, gender, base_price, mrp, is_featured, is_new_arrival, alt_text)
  values ('Cuddle Muslin Swaddle Set', 'cuddle-muslin-swaddle-set',
    'Set of 3 breathable muslin swaddles in soothing pastels. Perfect for sleep, feed and play. Softens with every wash.',
    'Pack of 3 • 100% muslin • Breathable',
    baby_id, 'unisex', 749, 999, false, true, 'Muslin swaddle set in pastel colors')
  returning id into p_id;
  insert into public.product_images (product_id, url, alt_text, sort_order) values
    (p_id, 'https://images.unsplash.com/photo-1768693602418-260d828b878d?w=1000', 'Muslin swaddle set flat lay', 0);
  insert into public.product_variants (product_id, size, color, sku, stock_qty) values
    (p_id, 'One Size', 'Pastel Mix', 'CMS-OS-PM', 40);

  -- Product 4
  insert into public.products (name, slug, description, short_description, category_id, gender, base_price, mrp, is_featured, is_new_arrival, alt_text)
  values ('Rainbow Learning Blocks', 'rainbow-learning-blocks',
    '60-piece BPA-free wooden block set to build motor skills, colours and creativity. Non-toxic paints, smooth rounded edges.',
    '60 pieces • Non-toxic • Wooden',
    toys_id, 'unisex', 1499, 1999, true, false, 'Colorful wooden learning blocks')
  returning id into p_id;
  insert into public.product_images (product_id, url, alt_text, sort_order) values
    (p_id, 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=1000', 'Rainbow learning blocks', 0);
  insert into public.product_variants (product_id, color, sku, stock_qty) values
    (p_id, 'Multi', 'RLB-MULTI', 20);
  insert into public.product_age_groups values (p_id, age_1_2),(p_id, age_2_4);

  -- Product 5
  insert into public.products (name, slug, description, short_description, category_id, gender, base_price, mrp, is_featured, is_new_arrival, alt_text)
  values ('Adventure School Backpack', 'adventure-school-backpack',
    'Ergonomic school backpack with padded straps, water-resistant fabric and dedicated laptop sleeve. Reflective strips for safety.',
    'Ergonomic • Water-resistant • Reflective',
    bags_id, 'unisex', 1799, 2299, false, true, 'Kids school backpack')
  returning id into p_id;
  insert into public.product_images (product_id, url, alt_text, sort_order) values
    (p_id, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000', 'Kids school backpack', 0);
  insert into public.product_variants (product_id, color, color_hex, sku, stock_qty) values
    (p_id, 'Navy', '#1E2A4A', 'ASB-NAVY', 14),
    (p_id, 'Coral', '#E63946', 'ASB-CORAL', 11);
  insert into public.product_age_groups values (p_id, age_4_6),(p_id, age_6_8);

  -- Product 6
  insert into public.products (name, slug, description, short_description, category_id, gender, base_price, mrp, is_featured, is_new_arrival, alt_text)
  values ('Classic Denim Dungaree', 'classic-denim-dungaree',
    'Timeless denim dungaree with adjustable straps and front pocket. Pairs with any tee for effortless play-day style.',
    'Adjustable straps • Soft denim',
    clothing_id, 'boys', 1099, 1499, true, false, 'Boys denim dungaree')
  returning id into p_id;
  insert into public.product_images (product_id, url, alt_text, sort_order) values
    (p_id, 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1000', 'Denim dungaree', 0);
  insert into public.product_variants (product_id, size, color, sku, stock_qty) values
    (p_id, '2-4Y', 'Indigo', 'CDD-2-IND', 10),
    (p_id, '4-6Y', 'Indigo', 'CDD-4-IND', 8),
    (p_id, '6-8Y', 'Indigo', 'CDD-6-IND', 6);
  insert into public.product_age_groups values (p_id, age_2_4),(p_id, age_4_6),(p_id, age_6_8);

  -- Product 7
  insert into public.products (name, slug, description, short_description, category_id, gender, base_price, mrp, is_featured, is_new_arrival, alt_text)
  values ('Soft Teddy Companion', 'soft-teddy-companion',
    'Hypoallergenic plush teddy in butter-soft velour. Machine-washable, ultra-cuddly, becomes your child''s best friend.',
    'Hypoallergenic • Machine washable',
    toys_id, 'unisex', 599, 799, false, true, 'Soft brown teddy bear')
  returning id into p_id;
  insert into public.product_images (product_id, url, alt_text, sort_order) values
    (p_id, 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=1000', 'Soft teddy bear', 0);
  insert into public.product_variants (product_id, color, sku, stock_qty) values
    (p_id, 'Beige', 'STC-BEIGE', 25);

  -- Product 8
  insert into public.products (name, slug, description, short_description, category_id, gender, base_price, mrp, is_featured, is_new_arrival, alt_text)
  values ('Party Twirl Princess Gown', 'party-twirl-princess-gown',
    'Tulle-layered gown with sequin bodice, made for parties and photo moments. Comfortable inner lining, easy zip back.',
    'Tulle layers • Sequin bodice',
    clothing_id, 'girls', 2199, 2999, true, false, 'Pink princess party gown')
  returning id into p_id;
  insert into public.product_images (product_id, url, alt_text, sort_order) values
    (p_id, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1000', 'Princess gown', 0);
  insert into public.product_variants (product_id, size, color, sku, stock_qty) values
    (p_id, '2-4Y', 'Blush Pink', 'PTP-2-BP', 5),
    (p_id, '4-6Y', 'Blush Pink', 'PTP-4-BP', 6),
    (p_id, '6-8Y', 'Ivory', 'PTP-6-IV', 4);
  insert into public.product_age_groups values (p_id, age_2_4),(p_id, age_4_6),(p_id, age_6_8);
end $$;
