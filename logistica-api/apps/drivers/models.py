from django.conf import settings
from django.db import models
from apps.transport.models import Transport


class Driver(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='driver_profile',
    )
    transport = models.ForeignKey(
        Transport,
        on_delete=models.SET_NULL,
        related_name='drivers',
        null=True,
        blank=True,
    )
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    phone = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'drivers'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.get_full_name()} ({self.license_number})'
