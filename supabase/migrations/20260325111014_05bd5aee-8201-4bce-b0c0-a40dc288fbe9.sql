ALTER TABLE public.orders ADD COLUMN customer_name text;
ALTER TABLE public.orders ADD COLUMN customer_phone text;

DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);