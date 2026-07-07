import { formatCurrency } from "@/lib/gst";

export function InvoicePreview({ data, items, totals, business }) {
  return (
    <div className="w-full font-sans text-sm">
      <div className="mb-6 flex items-start justify-between border-b-2 border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">INVOICE</h1>
          <p className="mt-1 text-gray-500"># {data.invoiceNumber}</p>
        </div>
        <div className="max-w-xs text-right">
          <h2 className="text-lg font-bold text-gray-800">{business?.businessName || business?.name || "Your Business"}</h2>
          <p className="text-gray-500">{business?.address || "Business address"}</p>
          <p className="mt-1 font-medium text-gray-500">GSTIN: {business?.gstin || "Not configured"}</p>
        </div>
      </div>

      <div className="mb-8 flex justify-between gap-8">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase text-gray-700">Bill To</h3>
          <p className="font-semibold text-gray-900">{data.customer?.name || "Select a customer"}</p>
          <p className="whitespace-pre-line text-gray-600">{data.customer?.address || "Customer address"}</p>
          {data.customer?.gstin && <p className="mt-1 text-gray-600"><span className="font-medium">GSTIN:</span> {data.customer.gstin}</p>}
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="font-bold text-gray-700">Invoice Date:</span>
            <span className="text-gray-600">{data.date}</span>
            {data.dueDate && (
              <>
                <span className="font-bold text-gray-700">Due Date:</span>
                <span className="text-gray-600">{data.dueDate}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <table className="mb-8 w-full border-collapse text-left">
        <thead>
          <tr className="border-y border-gray-300 bg-gray-100 text-gray-800">
            <th className="px-2 py-3 font-bold">#</th>
            <th className="w-1/3 px-2 py-3 font-bold">Item</th>
            <th className="px-2 py-3 font-bold">HSN/SAC</th>
            <th className="px-2 py-3 text-right font-bold">Qty</th>
            <th className="px-2 py-3 text-right font-bold">Rate</th>
            <th className="px-2 py-3 text-right font-bold">GST</th>
            <th className="px-2 py-3 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="px-2 py-3">{index + 1}</td>
              <td className="px-2 py-3 font-medium">{item.name || "-"}</td>
              <td className="px-2 py-3">{item.hsnCode || "-"}</td>
              <td className="px-2 py-3 text-right">{item.quantity}</td>
              <td className="px-2 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
              <td className="px-2 py-3 text-right">{item.gstRate}%</td>
              <td className="px-2 py-3 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-1/2">
          <div className="flex justify-between py-2 text-gray-600">
            <span>Subtotal:</span>
            <span>{formatCurrency(totals.subTotal)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between py-2 text-gray-600">
              <span>Discount ({data.discountPercent}%):</span>
              <span className="text-red-500">-{formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 text-gray-600">
            <span>Taxable Amount:</span>
            <span>{formatCurrency(totals.taxableAmount)}</span>
          </div>
          {data.isInterState ? (
            <div className="flex justify-between py-2 text-gray-600">
              <span>IGST:</span>
              <span>{formatCurrency(totals.igstAmount)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between py-2 text-gray-600">
                <span>CGST:</span>
                <span>{formatCurrency(totals.cgstAmount)}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-600">
                <span>SGST:</span>
                <span>{formatCurrency(totals.sgstAmount)}</span>
              </div>
            </>
          )}
          <div className="mt-2 flex justify-between border-t-2 border-gray-800 py-3 text-lg font-bold text-gray-900">
            <span>Grand Total:</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 border-t border-gray-200 pt-8 text-center text-xs text-gray-500">
        <p>This is a computer generated invoice and does not require a physical signature.</p>
        <p className="mt-1">Thank you for your business.</p>
      </div>
    </div>
  );
}
