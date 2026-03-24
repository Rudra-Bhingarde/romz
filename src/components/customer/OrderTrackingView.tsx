import { useState, useEffect } from "react";
import { getOrderById, subscribeToOrderById } from "@/services/supabaseService";
import { Clock, ChefHat, PartyPopper, CheckCircle2 } from "lucide-react";

interface Props {
  orderId: string;
}

const statusConfig = {
  pending: {
    label: "Order Received",
    description: "Your order has been sent to the kitchen",
    icon: Clock,
    className: "status-pending",
  },
  preparing: {
    label: "Being Prepared",
    description: "The chef is working on your order",
    icon: ChefHat,
    className: "status-preparing",
  },
  ready: {
    label: "Ready for Collection!",
    description: "Head to the counter to pick up your order",
    icon: PartyPopper,
    className: "status-ready",
  },
  completed: {
    label: "Completed",
    description: "Thank you for dining with us!",
    icon: CheckCircle2,
    className: "status-completed",
  },
};

const steps = ["pending", "preparing", "ready", "completed"] as const;

export default function OrderTrackingView({ orderId }: Props) {
  const [status, setStatus] = useState<keyof typeof statusConfig>("pending");

  useEffect(() => {
    getOrderById(orderId).then(({ data }) => {
      if (data) setStatus(data.status);
    });

    const channel = subscribeToOrderById(orderId, (payload: any) => {
      if (payload.new?.status) {
        setStatus(payload.new.status);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [orderId]);

  const config = statusConfig[status];
  const Icon = config.icon;
  const currentIndex = steps.indexOf(status);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-8 animate-slide-up">
        <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center ${config.className} ${status === "ready" ? "animate-pulse-soft" : ""}`}>
          <Icon className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold">{config.label}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  i <= currentIndex ? "bg-primary scale-110" : "bg-border"
                }`}
              />
              {i < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 transition-all duration-500 ${
                    i < currentIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Order #{orderId.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
