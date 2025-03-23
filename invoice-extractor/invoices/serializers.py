from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Invoice
from django.core.exceptions import ValidationError

# ✅ User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')
        read_only_fields = ('id',)

# ✅ User Registration Serializer
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def validate_email(self, value):
        """Ensure email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        """Create user with hashed password."""
        return User.objects.create_user(**validated_data)

# ✅ Invoice Serializer
class InvoiceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Prevent user from being modified
    file_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    file_type = serializers.CharField(read_only=True)

    class Meta:
        model = Invoice
        fields = (
            'id', 'user', 'file', 'file_url', 'file_size', 'file_type', 'uploaded_at', 
            'invoice_date', 'invoice_number', 'amount', 'due_date',
            'status', 'error_message'
        )
        read_only_fields = (
            'id', 'user', 'uploaded_at', 'invoice_date', 'invoice_number', 
            'amount', 'due_date', 'status', 'error_message', 'file_type'
        )

    def get_file_url(self, obj):
        """Generate full file URL."""
        request = self.context.get('request')
        return request.build_absolute_uri(obj.file.url) if obj.file and request else None

    def get_file_size(self, obj):
        """Return file size in KB."""
        return obj.file.size // 1024 if obj.file else None

    def validate_file(self, file):
        """Ensure file is not too large (limit: 10MB)."""
        if file.size > 10 * 1024 * 1024:  # 10MB limit
            raise ValidationError("File size must be 10MB or smaller.")
        return file

    def create(self, validated_data):
        """Auto-assign user from request."""
        request = self.context.get('request')
        if request and hasattr(request, "user"):
            validated_data["user"] = request.user
        return super().create(validated_data)

