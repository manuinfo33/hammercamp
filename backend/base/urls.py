from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'teams', views.TeamViewSet)
router.register(r'delegates', views.DelegateViewSet)
router.register(r'transacciones', views.TransaccionViewSet, basename='transaccion')
router.register(r'saldo-socios', views.SaldoSocioViewSet)
router.register(r'tournaments', views.TournamentViewSet)
router.register(r'tournament-zones', views.TournamentZoneViewSet)
router.register(r'zone-teams', views.ZoneTeamViewSet)
router.register(r'carousel-images', views.CarouselImageViewSet)
router.register(r'news', views.NewsViewSet)
router.register(r'match-rounds', views.MatchRoundViewSet)
router.register(r'matches', views.MatchViewSet)
router.register(r'goleadores', views.GoleadorViewSet)
router.register(r'valla-menos-vencida', views.VallaMenosVencidaViewSet)
router.register(r'sancionados', views.SancionadoViewSet)
router.register(r'players', views.PlayerViewSet)
router.register(r'good-faith-lists', views.GoodFaithListViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('hello/', views.hello_world, name='hello_world'),
    path('user-info/', views.get_user_info, name='user_info'),
    path('caja/resumen/', views.caja_resumen, name='caja_resumen'),
    path('merge-pdf/', views.merge_pdf, name='merge_pdf'),
    path('add-to-zip-session/', views.add_to_zip_session, name='add_to_zip_session'),
    path('download/<str:filename>/', views.download_temp, name='download_temp'),
]
