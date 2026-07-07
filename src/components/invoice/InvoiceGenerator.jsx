"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileDown, Plus, Printer, Save, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getInvoiceTotals } from "@/lib/gst";
import { toast } from "sonner";
import { InvoicePreview } from "./InvoicePreview";

const emptyItem = { id: 1, productId: "", name: "", hsnCode: "", quantity: 1, unitPrice: 0, gstRate: 18 };

export function InvoiceGenerator() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [business, setBusiness] = useState(null);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    customerId: "",
    customer: null,
    discountPercent: 0,
    isInterState: false,
    status: "Pending",
  });
  const [items, setItems] = useState([emptyItem]);
  const previewRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?pageSize=50").then((res) => res.json()),
      fetch("/api/products?pageSize=50").then((res) => res.json()),
      fetch("/api/settings").then((res) => res.json()),
    ]).then(([customerData, productData, settings]) => {
      setCustomers(customerData.data || []);
      setProducts(productData.data || []);
      setBusiness(settings);
    });
  }, []);

  const totals = useMemo(() => getInvoiceTotals(items, invoiceData.discountPercent, invoiceData.isInterState), [items, invoiceData.discountPercent, invoiceData.isInterState]);

  const setCustomer = (customerId) => {
    const customer = customers.find((item) => item.id === customerId) || null;
    setInvoiceData((prev) => ({ ...prev, customerId, customer }));
  };

  const setProduct = (rowId, productId) => {
    const product = products.find((item) => item.id === productId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId && product
          ? {
              ...item,
              productId,
              name: product.name,
              hsnCode: product.hsnCode || "",
              unitPrice: product.price,
              gstRate: product.gstPercentage,
            }
          : item
      )
    );
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem, id: Date.now() }]);
  };

  const removeItem = (id) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const saveInvoice = async () => {
    if (!invoiceData.customerId) return toast.error("Select a customer");
    if (items.some((item) => !item.productId)) return toast.error("Select a product for every row");

    const res = await fetch("/api/invoices", {
      method: "POST",
      body: JSON.stringify({ ...invoiceData, items }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to save invoice");
    toast.success(`Invoice ${json.invoiceNumber} saved`);
    setInvoiceData((prev) => ({ ...prev, invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` }));
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`${invoiceData.invoiceNumber}.pdf`);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const printInvoice = () => window.print();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Card className="space-y-6 border-none p-6 glass-card">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <h3 className="text-lg font-semibold">Invoice Details</h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={invoiceData.isInterState} onChange={(e) => setInvoiceData({ ...invoiceData, isInterState: e.target.checked })} />
              Inter-state IGST
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={invoiceData.invoiceNumber} onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={invoiceData.date} onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={invoiceData.dueDate} onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm" value={invoiceData.customerId} onChange={(e) => setCustomer(e.target.value)}>
                <option value="">Select customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item #{index + 1}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="space-y-1 md:col-span-4">
                    <Label className="text-xs">Product/Service</Label>
                    <select className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm" value={item.productId} onChange={(e) => setProduct(item.id, e.target.value)}>
                      <option value="">Select product</option>
                      {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">HSN/SAC</Label>
                    <Input value={item.hsnCode} onChange={(e) => updateItem(item.id, "hsnCode", e.target.value)} className="h-9 bg-background/50 text-sm" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} className="h-9 bg-background/50 text-sm" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Rate</Label>
                    <Input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} className="h-9 bg-background/50 text-sm" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">GST</Label>
                    <select className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm" value={item.gstRate} onChange={(e) => updateItem(item.id, "gstRate", Number(e.target.value))}>
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t pt-4">
            <div className="w-full max-w-xs space-y-2">
              <Label>Discount (%)</Label>
              <Input type="number" min="0" max="100" value={invoiceData.discountPercent} onChange={(e) => setInvoiceData({ ...invoiceData, discountPercent: Number(e.target.value) })} className="bg-background/50" />
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <Button onClick={downloadPDF} className="gap-2" variant="secondary"><FileDown className="h-4 w-4" /> PDF</Button>
          <Button onClick={printInvoice} className="gap-2" variant="outline"><Printer className="h-4 w-4" /> Print</Button>
          <Button onClick={saveInvoice} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-xl border bg-muted/20 p-4 lg:p-8">
        <div className="absolute right-4 top-4 z-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Preview</span>
        </div>
        <div className="min-w-[700px] bg-white p-8 text-black shadow-sm print:shadow-none" ref={previewRef}>
          <InvoicePreview data={invoiceData} items={items} totals={totals} business={business} />
        </div>
      </div>
    </div>
  );
}
