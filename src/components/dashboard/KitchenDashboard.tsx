import { useState, useEffect } from "react";
import { getOrders, updateOrderStatus, subscribeToOrders } from "@/services/supabaseService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, ChefHat, PartyPopper, CheckCircle2, RefreshCw } from "lucide-react";

interface Props {
  restaurantId: string;
}

type OrderStatus = "pending" | "preparing" | "ready" | "completed";

const statusMeta: Record<OrderStatus, { label: string; icon: React.ReactNode; className: string; next?: OrderStatus; nextLabel?: string }> = {
  pending: { label: "Pending", icon: <Clock className="w-3.5 h-3.5" />, className: "status-pending", next: "preparing", nextLabel: "Start Preparing" },
  preparing: { label: "Preparing", icon: <ChefHat className="w-3.5 h-3.5" />, className: "status-preparing", next: "ready", nextLabel: "Mark Ready" },
  ready: { label: "Ready", icon: <PartyPopper className="w-3.5 h-3.5" />, className: "status-ready", next: "completed", nextLabel: "Complete" },
  completed: { label: "Completed", icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "status-completed" },
};

export default function KitchenDashboard({ restaurantId }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const fetchOrders = async () => {
    const { data } = await getOrders(restaurantId);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = subscribeToOrders(restaurantId, () => {
      fetchOrders();
    });
    return () => { channel.unsubscribe(); };
  }, [restaurantId]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await updateOrderStatus(orderId, newStatus);
    if (error) toast.error("Failed to update");
    else {
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders();
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const activeOrders = orders.filter((o) => o.status !== "completed");

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-semibold">Kitchen</h2>
          <p className="text-xs text-muted-foreground">{activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "pending", "preparing", "ready", "completed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {s === "all" ? "All" : statusMeta[s].label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {filter === "all" ? "No orders yet" : `No ${filter} orders`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const meta = statusMeta[order.status as OrderStatus];
            const orderItems = order.order_items || [];
            return (
              <div key={order.id} className="bg-card rounded-xl border border-border/50 p-4 space-y-3 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      Table {order.tables?.table_number || "?"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] gap-1 ${meta.className} border-0`}>
                    {meta.icon}
                    {meta.label}
                  </Badge>
                </div>

                <div className="space-y-1">
                  {orderItems.map((oi: any) => (
                    <div key={oi.id} className="flex justify-between text-xs">
                      <span>{oi.quantity}× {oi.menu_items?.name || "Item"}</span>
                      <span className="text-muted-foreground">
                        ${(Number(oi.menu_items?.price || 0) * oi.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <p className="text-xs font-semibold">${Number(order.total_amount).toFixed(2)}</p>
                  {meta.next && (
                    <Button
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      variant={order.status === "preparing" ? "default" : "outline"}
                      onClick={() => handleStatusChange(order.id, meta.next!)}
                    >
                      {meta.nextLabel}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
