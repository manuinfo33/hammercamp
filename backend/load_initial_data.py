import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hammercamp_backend.settings')
django.setup()

from django.core.management import call_command
from django.contrib.auth.models import User

def auto_import():
    user_count = User.objects.count()
    print(f"Verificando base de datos... Usuarios encontrados: {user_count}")
    if user_count == 0:
        print("Base de datos limpia detectada en PostgreSQL. Importando datadump.json...")
        try:
            call_command('loaddata', 'datadump.json')
            print("¡Importación de datos completada exitosamente!")
        except Exception as e:
            print(f"Error al cargar datadump.json: {e}")
    else:
        print("La base de datos ya cuenta con registros existentes. Se omite la carga inicial.")

if __name__ == '__main__':
    auto_import()
