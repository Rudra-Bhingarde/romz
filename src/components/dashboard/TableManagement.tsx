import { useState, useEffect } from "react";
import { getTables, createTable, deleteTable } from "@/services/supabaseService";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, QrCode, Copy } from "lucide-react";

interface Props {
  restaurantId: string;
}

export default function TableManagement({ restaurantId }: Props) {
  const [tables, setTables] = useState<Tables<"tables">[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNumber, setNewNumber] = useState("");

  const fetchTables = async () => {
    const { data } = await getTables(restaurantId);
    setTables(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, [restaurantId]);

  const handleAdd = async () => {
    const num = parseInt(newNumber);
    if (!num || num <= 0) { toast.error("Enter a valid table number"); return; }
    const { error } = await createTable(restaurantId, num);
    if (error) toast.error(error.message);
    else { setNewNumber(""); toast.success("Table added"); fetchTables(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteTable(id);
    if (error) toast.error(error.message);
    else { toast.success("Table deleted"); fetchTables(); }
  };

  const getQrUrl = (tableNumber: number) => {
    const base = window.location.origin;
    return `${base}/order?restaurantId=${restaurantId}&table=${tableNumber}`;
  };

  const copyLink = (tableNumber: number) => {
    navigator.clipboard.writeText(getQrUrl(tableNumber));
    toast.success("Link copied!");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold">Tables</h2>

      {/* Add form */}
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Table number"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAdd} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>

      {/* Table list */}
      {tables.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No tables yet</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {tables.map((table) => (
            <div key={table.id} className="bg-card rounded-xl border border-border/50 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">Table {table.table_number}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-7 gap-1" onClick={() => copyLink(table.table_number)}>
                  <Copy className="w-3 h-3" />
                  Copy Link
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(table.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
