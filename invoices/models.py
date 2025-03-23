from django.db import models
from django.contrib.auth.models import User
import os

class Invoice(models.Model):
    """Model representing an uploaded invoice with AI-extracted data."""

    # User who uploaded the invoice
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')

    # Invoice file
    file = models.FileField(upload_to='invoices/')
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Index for faster queries

    # File type (image/pdf)
    FILE_TYPES = (
        ('pdf', 'PDF'),
        ('image', 'Image'),
        ('text', 'Text'),
        ('unknown', 'Unknown'),
    )
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, default='unknown')

    # Extracted data from AI
    invoice_date = models.DateField(null=True, blank=True)
    invoice_number = models.CharField(max_length=100, null=True, blank=True, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)

    # Processing metadata
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    error_message = models.TextField(null=True, blank=True)

    # AI processing timestamps
    processing_started_at = models.DateTimeField(null=True, blank=True)
    processing_completed_at = models.DateTimeField(null=True, blank=True)

    # Soft delete (instead of permanent deletion)
    is_deleted = models.BooleanField(default=False, db_index=True)

    def save(self, *args, **kwargs):
        """Auto-assigns invoice number if missing."""
        if not self.invoice_number:
            self.invoice_number = f"INV-{self.id or 'NEW'}-{self.uploaded_at.strftime('%Y%m%d')}"
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Soft delete instead of permanent deletion."""
        self.is_deleted = True
        self.save()

    def __str__(self):
        return f"Invoice {self.id} - {self.invoice_number or 'Unknown'} ({self.status})"

    class Meta:
        ordering = ['-uploaded_at']

