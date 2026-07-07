"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const emptyForm = { name: "", email: "", phone: "", gstin: "", address: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const query = useMemo(() => new URLSearchParams({ search, page: String(meta.page), pageSize: "8" }), [search, meta.page]);
  const queryString = query.toString();

  useEffect(() => {
    let active = true;

    const loadCustomers = async () => {
      const frame = requestAnimationFrame(() => {
        if (active) setLoading(true);
      });

      try {
        const res = await fetch(`/api/customers?${query}`);
        const json = await res.json();
        if (active && res.ok) {
          setCustomers(json.data);
          setMeta(json.meta);
        }
      } finally {
        if (active) {
          cancelAnimationFrame(frame);
          setLoading(false);
        }
      }
    };

    void loadCustomers();

    return () => {
      active = false;
    };
  }, [query, queryString]);

  const openForm = (customer = null) => {
    setEditing(customer);
    setForm(customer || emptyForm);
    setOpen(true);
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    const res = await fetch(editing ? `/api/customers/${editing.id}` : "/api/customers", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to save customer");
    toast.success(editing ? "Customer updated" : "Customer added");
    setOpen(false);
    loadCustomers();
  };

  const deleteCustomer = async (customer) => {
    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to delete customer");
    toast.success("Customer deleted");
    loadCustomers();
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Customers</h1>
            <p className="mt-1 text-muted-foreground">Manage clients, GSTINs, search, and billing details.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openForm()} className="gap-2">
                <Plus className="h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={saveCustomer} className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>GSTIN</Label>
                  <Input value={form.gstin || ""} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} placeholder="29ABCDE1234F1Z5" />
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <textarea className="min-h-24 rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <Button type="submit">{editing ? "Save Changes" : "Create Customer"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card border-none p-4">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search customers, email, GSTIN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50" />
            </div>
            <span className="text-sm text-muted-foreground">{meta.total} customers</span>
          </div>

          <div className="overflow-hidden rounded-md border bg-background/50 backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.gstin || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openForm(customer)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteCustomer(customer)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No customers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
            <Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}>Next</Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
