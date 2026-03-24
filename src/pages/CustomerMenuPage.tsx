import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getRestaurantById, getMenuItems, getTables, createOrder } from "@/services/supabaseService";
import { useCart } from "@/hooks/useCart";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, CreditCard, Check } from "lucide-react";
import OrderTrackingView from "@/components/customer/OrderTrackingView";

export default function CustomerMenuPage() {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get("restaurantId") || "";
  const tableNum = searchParams.get("table") || "";

  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [menuItems, setMenuItems] = useState<Tables<"menu_items">[]>([]);
  const [tables, setTables] = useState<Tables<"tables">[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { items, addItem, removeItem, updateQuantity, clearCart, totalAmount, totalItems } = useCart();

  const tableRecord = tables.find((t) => t.table_number === Number(tableNum));

  useEffect(() => {
    if (!restaurantId) return;
    Promise.all([
      getRestaurantById(restaurantId),
      getMenuItems(restaurantId),
      getTables(restaurantId),
    ]).then(([r, m, t]) => {
      setRestaurant(r.data);
      setMenuItems((m.data || []).filter((i) => i.is_available));
      setTables(t.data || []);
      setLoading(false);
    });
  }, [restaurantId]);

  const handlePlaceOrder = async () => {
    if (!tableRecord) {
      toast.error("Invalid table");
      return;
    }
    setPlacingOrder(true);
    const { data, error } = await createOrder(
      restaurantId,
      tableRecord.id,
      totalAmount,
      items.map((i) => ({ menu_item_id: i.menuItem.id, quantity: i.quantity }))
    );
    setPlacingOrder(false);
    if (error) {
      toast.error("Failed to place order");
    } else if (data) {
      setOrderId(data.id);
      clearCart();
      setCartOpen(false);
      setShowPayment(false);
      toast.success("Order placed!");
    }
  };

  if (orderId) {
    return <OrderTrackingView orderId={orderId} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-muted-foreground">Restaurant not found.</p>
      </div>
    );
  }

  const categories = [...new Set(menuItems.map((i) => i.category))];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-display font-bold">{restaurant.name}</h1>
          <p className="text-xs text-muted-foreground">Table {tableNum}</p>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-lg mx-auto p-4 space-y-8">
        {categories.map((cat) => (
          <section key={cat} className="animate-slide-up">
            <h2 className="text-lg font-display font-semibold mb-3">{cat}</h2>
            <div className="space-y-3">
              {menuItems
                .filter((i) => i.category === cat)
                .map((item) => {
                  const cartItem = items.find((c) => c.menuItem.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-card rounded-xl p-4 border border-border/50 flex justify-between items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-primary mt-1">
                          ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cartItem ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-semibold w-5 text-center">
                              {cartItem.quantity}
                            </span>
                            <Button
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => addItem(item)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => addItem(item)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </main>

      {/* Cart FAB */}
      {totalItems > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <Button
            size="lg"
            className="rounded-full shadow-lg px-6 gap-2"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            View Cart ({totalItems})
            <span className="ml-1 font-semibold">${totalAmount.toFixed(2)}</span>
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => { setCartOpen(false); setShowPayment(false); }} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-display font-semibold">
                {showPayment ? "Payment" : "Your Order"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => { setCartOpen(false); setShowPayment(false); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {showPayment ? (
              <div className="p-4 space-y-4">
                <div className="bg-surface rounded-xl p-4 space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Card Number</label>
                    <div className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                      •••• •••• •••• 4242
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Expiry</label>
                      <div className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground">12/26</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">CVC</label>
                      <div className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground">•••</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">Demo payment — no real charge</p>
                </div>
                <div className="flex justify-between text-sm font-semibold px-1">
                  <span>Total</span>
                  <span className="text-primary">${totalAmount.toFixed(2)}</span>
                </div>
                <Button className="w-full gap-2" onClick={handlePlaceOrder} disabled={placingOrder}>
                  <Check className="w-4 h-4" />
                  {placingOrder ? "Placing..." : `Pay $${totalAmount.toFixed(2)}`}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.menuItem.id} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${Number(item.menuItem.price).toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                        <Button size="icon" className="h-7 w-7 rounded-lg" onClick={() => addItem(item.menuItem)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold w-16 text-right">
                        ${(Number(item.menuItem.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span className="text-primary">${totalAmount.toFixed(2)}</span>
                  </div>
                  <Button className="w-full gap-2" onClick={() => setShowPayment(true)}>
                    <CreditCard className="w-4 h-4" />
                    Proceed to Payment
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
