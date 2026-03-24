import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

// Auth
export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

// Restaurants
export const getMyRestaurant = async (userId: string) => {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  return { data, error };
};

export const createRestaurant = async (name: string, ownerId: string) => {
  const { data, error } = await supabase
    .from("restaurants")
    .insert({ name, owner_id: ownerId })
    .select()
    .single();
  return { data, error };
};

export const getRestaurantById = async (id: string) => {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
};

// Tables
export const getTables = async (restaurantId: string) => {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("table_number");
  return { data, error };
};

export const createTable = async (restaurantId: string, tableNumber: number) => {
  const { data, error } = await supabase
    .from("tables")
    .insert({ restaurant_id: restaurantId, table_number: tableNumber })
    .select()
    .single();
  return { data, error };
};

export const deleteTable = async (id: string) => {
  const { error } = await supabase.from("tables").delete().eq("id", id);
  return { error };
};

// Menu Items
export const getMenuItems = async (restaurantId: string) => {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("category")
    .order("name");
  return { data, error };
};

export const createMenuItem = async (item: TablesInsert<"menu_items">) => {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(item)
    .select()
    .single();
  return { data, error };
};

export const updateMenuItem = async (id: string, updates: Partial<TablesInsert<"menu_items">>) => {
  const { data, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
};

export const deleteMenuItem = async (id: string) => {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  return { error };
};

// Orders
export const getOrders = async (restaurantId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, tables(*), order_items(*, menu_items(*))")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  return { data, error };
};

export const createOrder = async (
  restaurantId: string,
  tableId: string,
  totalAmount: number,
  items: { menu_item_id: string; quantity: number }[]
) => {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      total_amount: totalAmount,
    })
    .select()
    .single();

  if (orderError || !order) return { data: null, error: orderError };

  const orderItems = items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) return { data: null, error: itemsError };

  return { data: order, error: null };
};

export const updateOrderStatus = async (
  orderId: string,
  status: "pending" | "preparing" | "ready" | "completed"
) => {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();
  return { data, error };
};

export const getOrderById = async (orderId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, tables(*), order_items(*, menu_items(*))")
    .eq("id", orderId)
    .single();
  return { data, error };
};

// Realtime
export const subscribeToOrders = (
  restaurantId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`orders-${restaurantId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToOrderById = (
  orderId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`order-${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      callback
    )
    .subscribe();
};
