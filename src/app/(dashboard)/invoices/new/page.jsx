"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { InvoiceGenerator } from "@/components/invoice/InvoiceGenerator";

export default function NewInvoicePage() {
  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Create Invoice</h1>
          <p className="text-muted-foreground mt-1">Generate a new GST invoice with live preview.</p>
        </div>
        <InvoiceGenerator />
      </div>
    </PageWrapper>
  );
}
