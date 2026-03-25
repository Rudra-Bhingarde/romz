
-- Drop the old permissive insert policy
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;

-- New policy: authenticated users can insert orders with their customer_id
CREATE POLICY "Authenticated users can insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Allow customers to view their own orders
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;

CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (customer_id = auth.uid() OR EXISTS (
  SELECT 1 FROM restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.owner_id = auth.uid()
));

-- Also allow anon to view orders (for backward compat, e.g. order tracking before this change)
CREATE POLICY "Anon can view orders"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Update order_items insert to require auth
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

CREATE POLICY "Authenticated users can insert order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (true);
