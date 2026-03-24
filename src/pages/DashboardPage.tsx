import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMyRestaurant, createRestaurant } from "@/services/supabaseService";
import { signOut } from "@/services/supabaseService";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogOut, UtensilsCrossed, LayoutGrid, ClipboardList, TableProperties } from "lucide-react";
import MenuManagement from "@/components/dashboard/MenuManagement";
import TableManagement from "@/components/dashboard/TableManagement";
import KitchenDashboard from "@/components/dashboard/KitchenDashboard";

type Tab = "kitchen" | "menu" | "tables";

export default function DashboardPage() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("kitchen");

  useEffect(() => {
    if (!user) return;
    getMyRestaurant(user.id).then(({ data }) => {
      setRestaurant(data);
      setLoading(false);
    });
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await createRestaurant(newName.trim(), user.id);
    setCreating(false);
    if (error) {
      toast.error(error.message);
    } else {
      setRestaurant(data);
      toast.success("Restaurant created!");
    }
  };

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
        <div className="w-full max-w-sm space-y-6 text-center animate-slide-up">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display">Name your restaurant</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Restaurant name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? "..." : "Create"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "kitchen", label: "Kitchen", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "menu", label: "Menu", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "tables", label: "Tables", icon: <TableProperties className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-display font-bold leading-tight">{restaurant.name}</h1>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="sticky top-[57px] z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4 animate-fade-in">
        {activeTab === "kitchen" && <KitchenDashboard restaurantId={restaurant.id} />}
        {activeTab === "menu" && <MenuManagement restaurantId={restaurant.id} />}
        {activeTab === "tables" && <TableManagement restaurantId={restaurant.id} />}
      </main>
    </div>
  );
}
