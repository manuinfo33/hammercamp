import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hammercamp_backend.settings')
django.setup()

from base.models import Category

categories = [
    "F11 Senior +40",
    "F11 Senior+50",
    "F11 Categoría Libre",
    "F7 masculino",
    "F7 femenino"
]

for cat_name in categories:
    Category.objects.get_or_create(name=cat_name)

print("Categorías iniciales creadas con éxito.")
