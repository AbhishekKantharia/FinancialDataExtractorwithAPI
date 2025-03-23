"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { api } from "../services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, X } from "lucide-react"

interface InvoiceUploaderProps {
  onSuccess: () => void
  onCancel: () => void
}

const InvoiceUploader = ({ onSuccess, onCancel }: InvoiceUploaderProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/tiff"]

  const validateAndSetFile = useCallback((file: File) => {
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a PDF, JPEG, PNG, or TIFF.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.")
      return
    }

    setFile(file)
    setError("")
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)

    if (e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }, [validateAndSetFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      validateAndSetFile(e.target.files[0])
    }
  }, [validateAndSetFile])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      await api.post("/api/invoices/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload invoice. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Upload Invoice</span>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={uploading} aria-label="Cancel upload">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          } ${file ? "bg-gray-50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Drop file here to upload"
        >
          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                  <Upload className="h-6 w-6" />
                </div>
              </div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              <Button variant="outline" size="sm" onClick={() => setFile(null)} disabled={uploading}>
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 p-3 rounded-full">
                  <Upload className="h-8 w-8 text-gray-500" />
                </div>
              </div>
              <div>
                <p className="font-medium">Drag and drop your invoice here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.tiff"
              />
              <p className="text-xs text-gray-500">Supported formats: PDF, JPEG, PNG, TIFF (max 10MB)</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Invoice"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default InvoiceUploader

