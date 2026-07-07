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
import { formatCurrency } from "@/lib/gst";
import { toast } from "sonner";

const emptyForm = { name: "", description: "", hsnCode: "", price: 0, gstPercentage: 18, stock: 0, category: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
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

    const loadProducts = async () => {
      const frame = requestAnimationFrame(() => {
        if (active) setLoading(true);
      });

      try {
        const res = await fetch(`/api/products?${query}`);
        const json = await res.json();
        if (active && res.ok) {
          setProducts(json.data);
          setMeta(json.meta);
        }
      } finally {
        if (active) {
          cancelAnimationFrame(frame);
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, [query, queryString]);

  const openForm = (product = null) => {
    setEditing(product);
    setForm(product || emptyForm);
    setOpen(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price || 0),
      gstPercentage: Number(form.gstPercentage || 0),
      stock: Number(form.stock || 0),
    };
    const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to save product");
    toast.success(editing ? "Product updated" : "Product added");
    setOpen(false);
    loadProducts();
  };

  const deleteProduct = async (product) => {
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to delete product");
    toast.success("Product deleted");
    loadProducts();
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Products & Services</h1>
            <p className="mt-1 text-muted-foreground">Manage inventory, prices, HSN/SAC codes, and GST percentages.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openForm()} className="gap-2">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={saveProduct} className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>HSN/SAC</Label>
                    <Input value={form.hsnCode || ""} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Price</Label>
                    <Input type="number" min="0" step="0.01" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>GST %</Label>
                    <select className="h-10 rounded-md border border-input bg-background/50 px-3 text-sm" value={form.gstPercentage} onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Stock</Label>
                    <Input type="number" value={form.stock ?? 0} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <textarea className="min-h-20 rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button type="submit">{editing ? "Save Changes" : "Create Product"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card border-none p-4">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search products, HSN, category..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/50" />
            </div>
            <span className="text-sm text-muted-foreground">{meta.total} products</span>
          </div>

          <div className="overflow-hidden rounded-md border bg-background/50 backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>HSN/SAC</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.hsnCode || "-"}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.gstPercentage}%</TableCell>
                    <TableCell>{product.stock < 0 ? "Service" : product.stock}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openForm(product)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteProduct(product)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No products found.</TableCell>
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
