"use client";

import { useEffect, useState } from "react";
import { Save, Upload } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const defaults = {
  businessName: "",
  gstin: "",
  address: "",
  logoUrl: "",
  theme: "light",
  currency: "INR",
  taxMode: "split",
};

export default function SettingsPage() {
  const [form, setForm] = useState(defaults);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setForm({ ...defaults, ...data }));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to save settings");
    setForm({ ...defaults, ...json });
    toast.success("Settings saved successfully");
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your business profile, GST, logo, invoice theme, and tax defaults.</p>
        </div>

        <form onSubmit={handleSave} className="max-w-4xl space-y-6">
          <Card className="space-y-6 border-none p-6 glass-card">
            <h3 className="border-b pb-4 text-lg font-semibold">Business Profile</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" value={form.businessName || ""} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" value={form.gstin || ""} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} className="bg-background/50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Business Address</Label>
                <textarea id="address" className="min-h-24 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <div className="flex gap-2">
                  <Input id="logoUrl" value={form.logoUrl || ""} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="bg-background/50" placeholder="/logo.png or https://..." />
                  <Button type="button" variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Logo</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-6 border-none p-6 glass-card">
            <h3 className="border-b pb-4 text-lg font-semibold">Invoice Preferences</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select id="currency" className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Invoice Theme</Label>
                <select id="theme" className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm" value={form.theme || "light"} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="classic">Classic</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxMode">Tax Settings</Label>
                <select id="taxMode" className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm" value={form.taxMode} onChange={(e) => setForm({ ...form, taxMode: e.target.value })}>
                  <option value="split">CGST + SGST by default</option>
                  <option value="igst">IGST by default</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="gap-2"><Save className="h-4 w-4" /> Save Changes</Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
