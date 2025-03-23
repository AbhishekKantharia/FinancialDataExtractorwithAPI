"use client"

import { useState, useEffect } from "react"
import { api } from "../services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, RefreshCw, FileText } from "lucide-react"
import { format } from "date-fns"
import InvoiceUploader from "./InvoiceUploader"
import InvoiceDetails from "./InvoiceDetails"

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

const Dashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showUploader, setShowUploader] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const response = await api.get("/api/invoices/")
      setInvoices(response.data)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch invoices. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleReprocess = async (id: number) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "processing" } : inv))
    try {
      const response = await api.post(`/api/invoices/${id}/reprocess/`)
      setInvoices(invoices.map(inv => (inv.id === id ? response.data : inv)))
    } catch (err) {
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "failed", error_message: "Reprocessing failed." } : inv))
    }
  }

  const handleUploadSuccess = () => {
    fetchInvoices()
    setShowUploader(false)
  }

  const getInvoiceTypeIcon = (invoice: Invoice) => {
    const isUtilityBill = invoice.invoice_number?.toLowerCase().includes("comcast") || invoice.invoice_number?.toLowerCase().includes("xfinity")

    return isUtilityBill ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FileText className="h-3 w-3 mr-1" />
        Utility
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <FileText className="h-3 w-3 mr-1" />
        Invoice
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoice Dashboard</h1>
        <Button onClick={() => setShowUploader(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Invoice
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showUploader && <InvoiceUploader onSuccess={handleUploadSuccess} onCancel={() => setShowUploader(false)} />}

      {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Your Invoices</span>
            <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invoices found. Upload your first invoice to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Invoice/Account Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{getInvoiceTypeIcon(invoice)}</TableCell>
                      <TableCell>{invoice.invoice_number || "N/A"}</TableCell>
                      <TableCell>
                        {invoice.invoice_date ? format(new Date(invoice.invoice_date), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>{invoice.amount ? `$${Number(invoice.amount).toFixed(2)}` : "N/A"}</TableCell>
                      <TableCell>
                        {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                            View
                          </Button>
                          {invoice.status === "failed" && (
                            <Button variant="outline" size="sm" onClick={() => handleReprocess(invoice.id)}>
                              Retry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

