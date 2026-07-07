"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { Download, FileDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, toCsv } from "@/lib/gst";
import { toast } from "sonner";

export default function ReportsPage() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then(setReport);
  }, []);

  const exportCsv = (name, rows) => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("GST Invoice Reports", 14, 18);
    pdf.setFontSize(11);
    pdf.text(`Total sales: ${formatCurrency(report?.summary?.totalSales || 0)}`, 14, 32);
    pdf.text(`GST collected: ${formatCurrency(report?.summary?.gstTotal || 0)}`, 14, 40);
    pdf.text(`Invoices: ${report?.summary?.invoiceCount || 0}`, 14, 48);
    pdf.save("gst-reports.pdf");
    toast.success("PDF exported");
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Reports</h1>
            <p className="mt-1 text-muted-foreground">Monthly sales, GST, customer, and product reports.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportCsv("monthly-sales", [["Month", "Sales", "GST", "Invoices"], ...(report?.monthly || []).map((row) => [row.name, row.sales, row.gst, row.invoices])])} className="gap-2">
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button onClick={exportPdf} className="gap-2"><FileDown className="h-4 w-4" /> PDF</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass-card border-none p-5">
            <p className="text-sm text-muted-foreground">Total sales</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(report?.summary?.totalSales || 0)}</p>
          </Card>
          <Card className="glass-card border-none p-5">
            <p className="text-sm text-muted-foreground">GST reports</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(report?.summary?.gstTotal || 0)}</p>
          </Card>
          <Card className="glass-card border-none p-5">
            <p className="text-sm text-muted-foreground">Invoices</p>
            <p className="mt-2 text-2xl font-bold">{report?.summary?.invoiceCount || 0}</p>
          </Card>
        </div>

        <Card className="glass-card border-none p-5">
          <h2 className="mb-4 font-semibold">Monthly sales</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gst" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <ReportTable title="Customer reports" rows={report?.customers || []} columns={["name", "gstin", "invoices", "sales"]} />
          <ReportTable title="Product reports" rows={report?.products || []} columns={["name", "hsnCode", "quantity", "sales"]} />
        </div>
      </div>
    </PageWrapper>
  );
}

function ReportTable({ title, rows, columns }) {
  return (
    <Card className="glass-card border-none p-4">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.name}-${index}`}>
              {columns.map((column) => (
                <TableCell key={column}>{column === "sales" ? formatCurrency(row[column]) : row[column] || "-"}</TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">No data yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
