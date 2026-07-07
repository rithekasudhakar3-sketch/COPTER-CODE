"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, FileText, IndianRupee, Package } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/gst";

const cards = [
  { key: "todaySales", title: "Today's sales", icon: IndianRupee },
  { key: "monthlySales", title: "Monthly sales", icon: FileText },
  { key: "gstCollected", title: "GST collected", icon: Package },
  { key: "pendingInvoices", title: "Pending invoices", icon: AlertCircle },
];

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const kpis = data?.kpis || {};

  return (
    <PageWrapper>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground">GST billing, collections, and invoice movement at a glance.</p>
          </div>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span>{kpis.customers || 0} customers</span>
            <span>{kpis.products || 0} products</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const value = card.key === "pendingInvoices" ? kpis[card.key] || 0 : formatCurrency(kpis[card.key] || 0);
            return (
              <motion.div key={card.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                <Card className="glass-card border-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data ? value : "Loading..."}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Updated from live invoice data</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-7">
          <Card className="glass-card border-none p-5 xl:col-span-4">
            <div className="mb-4">
              <h2 className="font-semibold">Monthly sales</h2>
              <p className="text-sm text-muted-foreground">Last six months</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chart || []}>
                  <defs>
                    <linearGradient id="sales" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area dataKey="sales" type="monotone" stroke="#2563eb" fill="url(#sales)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="glass-card border-none p-5 xl:col-span-3">
            <div className="mb-4">
              <h2 className="font-semibold">GST collected</h2>
              <p className="text-sm text-muted-foreground">Tax movement by month</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.chart || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="gst" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="glass-card border-none p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent invoices</h2>
            <Badge variant="outline">{data?.recentInvoices?.length || 0} latest</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.recentInvoices || []).map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customer?.name}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.grandTotal)}</TableCell>
                </TableRow>
              ))}
              {data?.recentInvoices?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No invoices yet. Create your first invoice to fill the dashboard.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PageWrapper>
  );
}
