import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export interface CustomerInfo {
  name: string;
  phone: string;
}

interface CustomerAuthGateProps {
  restaurantName: string;
  tableNumber: string;
  children: React.ReactNode;
  onSubmit: (info: CustomerInfo) => void;
  customerInfo: CustomerInfo | null;
}

export default function CustomerAuthGate({ restaurantName, tableNumber, children, onSubmit, customerInfo }: CustomerAuthGateProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (customerInfo) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), phone: phone.trim() });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm animate-slide-up border-border/50 shadow-lg">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-display">
            {restaurantName}
          </CardTitle>
          <CardDescription>
            Enter your details to order from Table {tableNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Your Name</Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone Number</Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={20}
              />
            </div>
            <Button type="submit" className="w-full">
              View Menu
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
