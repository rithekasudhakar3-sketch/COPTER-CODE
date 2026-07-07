"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import { Download, MoreHorizontal, Plus, Search } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { formatCurrency, toCsv } from "@/lib/gst";
import { toast } from "sonner";

const statusStyle = {
  Paid: "bg-green-500/20 text-green-700 dark:text-green-400",
  Pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  Overdue: "bg-red-500/20 text-red-700 dark:text-red-400",
  Cancelled: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", from: "", to: "" });
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(meta.page), pageSize: "8" });
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    return params;
  }, [filters, meta.page]);
  const queryString = query.toString();

  useEffect(() => {
    let active = true;

    const loadInvoices = async () => {
      try {
        const res = await fetch(`/api/invoices?${query}`);
        const json = await res.json();
        if (active && res.ok) {
          setInvoices(json.data);
          setMeta(json.meta);
        }
      } catch {
        if (active) {
          setInvoices([]);
          setMeta({ page: 1, totalPages: 1, total: 0 });
        }
      }
    };

    void loadInvoices();

    return () => {
      active = false;
    };
  }, [query, queryString]);

  const updateStatus = async (invoice, status) => {
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to update status");
    toast.success("Invoice status updated");
    loadInvoices();
  };

  const openPreview = async (invoice) => {
    const res = await fetch(`/api/invoices/${invoice.id}`);
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to load invoice");
    setPreviewInvoice(json);
    setPreviewOpen(true);
  };

  const exportCsv = () => {
    const rows = [["Invoice Number", "Customer", "GSTIN", "Date", "Status", "Amount"]];
    invoices.forEach((invoice) => {
      rows.push([
        invoice.invoiceNumber,
        invoice.customer?.name || "",
        invoice.customer?.gstin || "",
        new Date(invoice.date).toLocaleDateString(),
        invoice.status,
        invoice.grandTotal,
      ]);
    });

    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoice-history.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const exportPdf = async (invoice) => {
    const res = await fetch(`/api/invoices/${invoice.id}`);
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Unable to load invoice");

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;
    pdf.setFontSize(20);
    pdf.text("GST Invoice", 40, y);
    y += 24;
    pdf.setFontSize(11);
    pdf.text(`Invoice: ${json.invoiceNumber}`, 40, y);
    pdf.text(`Date: ${new Date(json.date).toLocaleDateString()}`, 220, y);
    y += 18;
    pdf.text(`Customer: ${json.customer?.name || "-"}`, 40, y);
    pdf.text(`GSTIN: ${json.customer?.gstin || "-"}`, 220, y);
    y += 18;
    pdf.text(`Status: ${json.status}`, 40, y);
    y += 24;

    pdf.setLineWidth(0.5);
    pdf.line(40, y, 555, y);
    y += 16;
    pdf.text("Item", 40, y);
    pdf.text("Qty", 280, y);
    pdf.text("Rate", 360, y);
    pdf.text("Amount", 470, y);
    y += 14;
    pdf.line(40, y, 555, y);

    json.items.forEach((item) => {
      y += 18;
      const name = item.product?.name || item.name || "-";
      pdf.text(name, 40, y);
      pdf.text(String(item.quantity), 280, y);
      pdf.text(formatCurrency(item.unitPrice), 360, y);
      pdf.text(formatCurrency(item.total), 470, y);
    });

    y += 24;
    pdf.line(40, y, 555, y);
    y += 18;
    pdf.text(`Subtotal: ${formatCurrency(json.subTotal)}`, 400, y);
    y += 16;
    pdf.text(`Discount: ${formatCurrency(json.discountAmount)}`, 400, y);
    y += 16;
    pdf.text(`Grand Total: ${formatCurrency(json.grandTotal)}`, 400, y);
    pdf.save(`${json.invoiceNumber}.pdf`);
    toast.success("PDF exported");
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Invoices</h1>
            <p className="mt-1 text-muted-foreground">Track invoices by number, customer, GSTIN, date, and status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button asChild className="gap-2">
              <Link href="/invoices/new"><Plus className="h-4 w-4" /> Create Invoice</Link>
            </Button>
          </div>
        </div>

        <Card className="glass-card border-none p-4">
          <div className="mb-6 grid gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Invoice, customer, GSTIN..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="pl-9 bg-background/50" />
            </div>
            <select className="h-10 rounded-md border border-input bg-background/50 px-3 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="bg-background/50" />
            <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="bg-background/50" />
          </div>

          <div className="overflow-hidden rounded-md border bg-background/50 backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customer?.name}</TableCell>
                    <TableCell>{invoice.customer?.gstin || "-"}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none ${statusStyle[invoice.status] || statusStyle.Cancelled}`}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.grandTotal)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {["Pending", "Paid", "Overdue", "Cancelled"].map((status) => (
                            <DropdownMenuItem key={status} onClick={() => updateStatus(invoice, status)}>Mark {status}</DropdownMenuItem>
                          ))}
                          <DropdownMenuItem onClick={() => openPreview(invoice)}>
                            <Download className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportPdf(invoice)}>
                            <Download className="mr-2 h-4 w-4" /> PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No invoices match your filters.</TableCell>
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

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <div className="max-h-[75vh] overflow-auto rounded-lg border bg-white p-2">
              <InvoicePreview
                data={{
                  invoiceNumber: previewInvoice.invoiceNumber,
                  date: previewInvoice.date,
                  dueDate: previewInvoice.dueDate,
                  customer: previewInvoice.customer,
                  discountPercent: 0,
                  isInterState: false,
                }}
                items={previewInvoice.items || []}
                totals={previewInvoice}
                business={previewInvoice.user}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
