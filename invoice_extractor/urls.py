from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# ✅ API versioning for better scalability
API_PREFIX = 'api/v1/'

urlpatterns = [
    # ✅ Admin Panel
    path('admin/', admin.site.urls),

    # ✅ Invoices API (Main App)
    path(f'{API_PREFIX}invoices/', include('invoices.urls')),

    # ✅ Authentication Endpoints
    path(f'{API_PREFIX}token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path(f'{API_PREFIX}token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ✅ Google Generative AI (LLM) Routes
    path(f'{API_PREFIX}ai/', include('ai.urls')),  # Create a new app for AI integrations
]

# ✅ Static & Media File Serving (Only in Debug Mode)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

