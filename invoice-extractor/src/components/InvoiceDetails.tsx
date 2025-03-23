"use client"

import { useCallback, useRef } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X, AlertTriangle, Download, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Invoice {
  id: number
  invoice_date: string | null
  invoice_number: string | null
  amount: number | null
  due_date: string | null
  status: "pending" | "processing" | "completed" | "failed"
  error_message: string | null
  uploaded_at: string
  file_url: string
}

interface InvoiceDetailsProps {
  invoice: Invoice
  onClose: () => void
}

const InvoiceDetails = ({ invoice, onClose }: InvoiceDetailsProps) => {
  const isUtilityBill = invoice.invoice_number?.toLowerCase().includes("comcast") || 
                        invoice.invoice_number?.toLowerCase().includes("xfinity")

  const fileDownloadRef = useRef<HTMLAnchorElement | null>(null)

  const handleExportData = useCallback(() => {
    const data = {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      amount: invoice.amount,
      due_date: invoice.due_date,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    if (fileDownloadRef.current) {
      fileDownloadRef.current.href = url
      fileDownloadRef.current.download = `invoice-${invoice.id}-data.json`
      fileDownloadRef.current.click()
      URL.revokeObjectURL(url)
    }
  }, [invoice])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Invoice Details</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isUtilityBill && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This appears to be a utility bill. The account number may be used as the invoice number.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              {isUtilityBill ? "Account/Invoice Number" : "Invoice Number"}
            </h3>
            <p className="mt-1 text-lg">{invoice.invoice_number || "Not detected"}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">{isUtilityBill ? "Statement Date" : "Invoice Date"}</h3>
            <p className="mt-1 text-lg">
              {invoice.invoice_date ? format(new Date(invoice.invoice_date), "MMMM d, yyyy") : "Not detected"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">{isUtilityBill ? "Total Amount Due" : "Amount"}</h3>
            <p className="mt-1 text-lg">{invoice.amount ? `$${Number(invoice.amount).toFixed(2)}` : "Not detected"}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">{isUtilityBill ? "Payment Due Date" : "Due Date"}</h3>
            <p className="mt-1 text-lg">
              {invoice.due_date ? format(new Date(invoice.due_date), "MMMM d, yyyy") : "Not detected"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  invoice.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : invoice.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : invoice.status === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Uploaded</h3>
            <p className="mt-1 text-sm">{format(new Date(invoice.uploaded_at), "MMMM d, yyyy h:mm a")}</p>
          </div>
        </div>

        {invoice.status === "failed" && invoice.error_message && (
          <Alert className="mt-4" variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{invoice.error_message}</AlertDescription>
          </Alert>
        )}

        {invoice.file_url && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Original Invoice</h3>
            <div className="border rounded-md overflow-hidden">
              {invoice.file_url.endsWith(".pdf") ? (
                <div className="p-4 text-center">
                  <p className="text-gray-500 mb-2">PDF Document</p>
                  <a href={invoice.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    <Download className="h-4 w-4 mr-1 inline" />
                    View PDF
                  </a>
                </div>
              ) : invoice.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={invoice.file_url} alt="Invoice" className="w-full h-auto max-h-96 object-contain" />
              ) : (
                <p className="p-4 text-gray-500 text-center">Unsupported file type</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {invoice.status === "completed" && (
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </CardFooter>
      <a ref={fileDownloadRef} style={{ display: "none" }} />
    </Card>
  )
}

export default InvoiceDetails

