import { useState, useEffect } from "react";
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "@/services/supabaseService";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

interface Props {
  restaurantId: string;
}

export default function MenuManagement({ restaurantId }: Props) {
  const [items, setItems] = useState<Tables<"menu_items">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", category: "General", description: "" });

  const fetchItems = async () => {
    const { data } = await getMenuItems(restaurantId);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [restaurantId]);

  const resetForm = () => {
    setForm({ name: "", price: "", category: "General", description: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error("Name and price required"); return; }
    if (editingId) {
      const { error } = await updateMenuItem(editingId, {
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        description: form.description || null,
      });
      if (error) toast.error(error.message);
      else { toast.success("Item updated"); resetForm(); fetchItems(); }
    } else {
      const { error } = await createMenuItem({
        restaurant_id: restaurantId,
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        description: form.description || null,
      });
      if (error) toast.error(error.message);
      else { toast.success("Item added"); resetForm(); fetchItems(); }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteMenuItem(id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchItems(); }
  };

  const handleToggleAvailability = async (item: Tables<"menu_items">) => {
    await updateMenuItem(item.id, { is_available: !item.is_available });
    fetchItems();
  };

  const startEdit = (item: Tables<"menu_items">) => {
    setForm({ name: item.name, price: String(item.price), category: item.category, description: item.description || "" });
    setEditingId(item.id);
    setShowForm(true);
  };

  const categories = [...new Set(items.map((i) => i.category))];

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold">Menu Items</h2>
        <Button size="sm" className="gap-1.5 rounded-lg" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3 animate-slide-up">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">{editingId ? "Edit Item" : "New Item"}</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}><X className="w-3.5 h-3.5" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input placeholder="Margherita Pizza" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Price ($)</Label>
              <Input type="number" step="0.01" placeholder="12.99" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Input placeholder="Pizzas" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input placeholder="Fresh tomato, mozzarella..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <Button className="w-full gap-1.5" onClick={handleSave}>
            <Check className="w-3.5 h-3.5" />
            {editingId ? "Update" : "Add Item"}
          </Button>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No menu items yet</div>
      ) : (
        categories.map((cat) => (
          <div key={cat} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h3>
            {items.filter((i) => i.category === cat).map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-border/50 p-3 flex items-center gap-3 animate-fade-in">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${!item.is_available ? "line-through text-muted-foreground" : ""}`}>{item.name}</p>
                  </div>
                  <p className="text-xs text-primary font-semibold">${Number(item.price).toFixed(2)}</p>
                </div>
                <Switch checked={item.is_available} onCheckedChange={() => handleToggleAvailability(item)} />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(item)}><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
