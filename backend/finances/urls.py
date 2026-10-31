from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'partners', views.PartnerViewSet)
router.register(r'staff-rates', views.StaffRateViewSet)
router.register(r'registrations', views.TeamRegistrationViewSet)
router.register(r'rate-changes', views.RateChangeViewSet, basename='rate-change')
router.register(r'days', views.FinancialDayViewSet)
router.register(r'day-incomes', views.DayIncomeViewSet)
router.register(r'day-expenses', views.DayExpenseViewSet)
router.register(r'movements', views.GeneralMovementViewSet, basename='fin-movement')

urlpatterns = [
    path('summary/', views.summary),
    path('tournament-fees/', views.tournament_fees),
    path('team-accounts/', views.team_accounts),
    path('team-initial-balances/', views.team_initial_balances),
    path('', include(router.urls)),
]
