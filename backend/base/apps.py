from django.apps import AppConfig


class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'base'
    verbose_name = 'Gestión Hammercamp'

    def ready(self):
        from django.db.models.signals import post_migrate
        
        def create_delegate_group(sender, **kwargs):
            try:
                from django.contrib.auth.models import Group
                Group.objects.get_or_create(name='Delegado')
            except Exception:
                pass

        post_migrate.connect(create_delegate_group, sender=self)
