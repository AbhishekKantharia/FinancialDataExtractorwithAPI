import os
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Invoice
from .serializers import InvoiceSerializer, UserSerializer, UserRegistrationSerializer
from .llm_service import InvoiceExtractor

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Allow filtering invoices by status and date."""
        queryset = Invoice.objects.filter(user=self.request.user).order_by('-uploaded_at')
        status_filter = self.request.query_params.get('status', None)
        date_filter = self.request.query_params.get('date', None)

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if date_filter:
            queryset = queryset.filter(uploaded_at__date=date_filter)

        return queryset

    def perform_create(self, serializer):
        """Save the invoice and start processing."""
        invoice = serializer.save(user=self.request.user, status='pending')
        self.process_invoice(invoice)
        return invoice

    def process_invoice(self, invoice):
        """Extract invoice data using LLM."""
        if invoice.status in ['processing', 'completed']:
            return  # Avoid redundant processing

        try:
            # Update status to processing
            invoice.status = 'processing'
            invoice.save()

            file_path = invoice.file.path

            # Extract data using LLM
            extractor = InvoiceExtractor()
            result = extractor.extract_invoice_data(file_path)

            if result['success']:
                # Update invoice with extracted data
                invoice.invoice_date = result['data'].get('invoice_date')
                invoice.invoice_number = result['data'].get('invoice_number')
                invoice.amount = result['data'].get('amount')
                invoice.due_date = result['data'].get('due_date')
                invoice.status = 'completed'
            else:
                invoice.status = 'failed'
                invoice.error_message = result.get('error', 'Unknown extraction error')

            invoice.save()

        except Exception as e:
            invoice.status = 'failed'
            invoice.error_message = str(e)
            invoice.save()

    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """Reprocess an invoice only if it failed."""
        invoice = self.get_object()
        
        if invoice.status != 'failed':
            return Response({"error": "Only failed invoices can be reprocessed."}, status=status.HTTP_400_BAD_REQUEST)

        self.process_invoice(invoice)
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

