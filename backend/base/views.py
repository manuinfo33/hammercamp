import io
import os
import tempfile
import zipfile
from collections import defaultdict
from pathlib import Path
from django.conf import settings
from django.http import HttpResponse
from django.db import transaction, models
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, parser_classes, action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from pypdf import PdfWriter, PdfReader, Transformation
from .models import Category, Team, Delegate, Transaccion, SaldoSocio, Tournament, TournamentZone, ZoneTeam, CarouselImage, MatchRound, Match, MatchPlayerStat, Goleador, VallaMenosVencida, Sancionado, Player, GoodFaithList
from .serializers import (CategorySerializer, TeamSerializer, UserSerializer, DelegateSerializer,
                          TransaccionSerializer, SaldoSocioSerializer,
                          TournamentSerializer, TournamentCreateSerializer,
                          TournamentZoneSerializer, ZoneTeamSerializer, CarouselImageSerializer,
                          MatchRoundSerializer, MatchSerializer,
                          GoleadorSerializer, VallaMenosVencidaSerializer, SancionadoSerializer,
                          PlayerSerializer, GoodFaithListSerializer)
from docx2pdf import convert as convert_docx_to_pdf

@api_view(['GET'])
def get_user_info(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello from Hammercamp Backend!"})

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        password = (
            request.headers.get('X-Password') or
            request.headers.get('x-password') or
            request.META.get('HTTP_X_PASSWORD') or
            (request.data and isinstance(request.data, dict) and request.data.get('password')) or
            request.query_params.get('password')
        )
        
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'detail': 'INVALID_PASSWORD', 'message': 'Usuario no autenticado.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        if not password or not request.user.check_password(password):
            return Response(
                {'detail': 'INVALID_PASSWORD', 'message': 'No se pudo eliminar la categoría. Verificá que la contraseña sea correcta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().destroy(request, *args, **kwargs)

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def perform_create(self, serializer):
        team = serializer.save()
        if team.delegate:
            team.delegate.team = team
            team.delegate.save()
            print(f"DEBUG: Team {team.name} created and linked to Delegate {team.delegate}")

    def perform_update(self, serializer):
        remove_logo = self.request.data.get('remove_logo') == 'true'
        remove_team_photo = self.request.data.get('remove_team_photo') == 'true'
        
        team = serializer.instance
        if remove_logo:
            team.logo = None
        if remove_team_photo:
            team.team_photo = None
            
        team = serializer.save()
        if team.delegate:
            team.delegate.team = team
            team.delegate.save()
            print(f"DEBUG: Team {team.name} updated and linked to Delegate {team.delegate}")

    def destroy(self, request, *args, **kwargs):
        team = self.get_object()
        if team.zone_teams.exists():
            zone_team = team.zone_teams.select_related('zone__tournament').first()
            tournament_name = zone_team.zone.tournament.name if (zone_team and zone_team.zone and zone_team.zone.tournament) else "un torneo"
            return Response(
                {
                    "detail": "ACTIVE_TEAM_CANNOT_BE_DELETED",
                    "message": f"El equipo \"{team.name}\" no se puede eliminar porque se encuentra activo en el torneo \"{tournament_name}\". Para eliminar este equipo, primero debes eliminar el torneo."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

class DelegateViewSet(viewsets.ModelViewSet):
    queryset = Delegate.objects.all()
    serializer_class = DelegateSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'dni']

    def perform_create(self, serializer):
        dni = serializer.validated_data.get('dni')
        if dni and Delegate.objects.filter(dni=dni).exists():
            from rest_framework import serializers
            raise serializers.ValidationError({"dni": "Ya existe un delegado creado con ese DNI en tu base de datos"})
        
        username = self.request.data.get('username')
        password = self.request.data.get('password')
        
        from rest_framework import serializers
        if not username:
            raise serializers.ValidationError({"username": "El nombre de usuario es obligatorio"})
        if not password:
            raise serializers.ValidationError({"password": "La contraseña es obligatoria"})
            
        from django.contrib.auth.models import User, Group
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "Este nombre de usuario ya está en uso"})
            
        user = User.objects.create_user(
            username=username,
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', ''),
            password=password
        )
        
        delegado_group = Group.objects.filter(name='Delegado').first()
        if delegado_group:
            user.groups.add(delegado_group)
            
        serializer.save(user=user)

    def perform_update(self, serializer):
        remove_dni_front = self.request.data.get('remove_dni_front') == 'true'
        remove_dni_back = self.request.data.get('remove_dni_back') == 'true'
        
        delegate = serializer.instance
        if remove_dni_front:
            delegate.dni_front = None
        if remove_dni_back:
            delegate.dni_back = None
            
        instance = delegate
        dni = serializer.validated_data.get('dni')
        if dni and Delegate.objects.filter(dni=dni).exclude(id=instance.id).exists():
            from rest_framework import serializers
            raise serializers.ValidationError({"dni": "Ya existe un delegado creado con ese DNI en tu base de datos"})
        
        username = self.request.data.get('username')
        password = self.request.data.get('password')
        
        from rest_framework import serializers
        from django.contrib.auth.models import User, Group
        
        if not instance.user:
            if not username:
                raise serializers.ValidationError({"username": "El nombre de usuario es obligatorio"})
            if not password:
                raise serializers.ValidationError({"password": "La contraseña es obligatoria"})
                
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({"username": "Este nombre de usuario ya está en uso"})
                
            user = User.objects.create_user(
                username=username,
                first_name=serializer.validated_data.get('first_name', ''),
                last_name=serializer.validated_data.get('last_name', ''),
                password=password
            )
            delegado_group = Group.objects.filter(name='Delegado').first()
            if delegado_group:
                user.groups.add(delegado_group)
            
            serializer.save(user=user)
        else:
            delegate = serializer.save()
            user = delegate.user
            user.first_name = delegate.first_name
            user.last_name = delegate.last_name
            
            if username and username != user.username:
                if User.objects.filter(username=username).exclude(id=user.id).exists():
                    raise serializers.ValidationError({"username": "Este nombre de usuario ya está en uso"})
                user.username = username
                
            if password:
                user.set_password(password)
                
            user.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        print(f"DEBUG: Deleting Delegate - ID: {instance.id}, Name: {instance.first_name} {instance.last_name}")
        return super().destroy(request, *args, **kwargs)


class TransaccionViewSet(viewsets.ModelViewSet):
    serializer_class = TransaccionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['concepto', 'descripcion']

    def get_queryset(self):
        qs = Transaccion.objects.all()
        tipo = self.request.query_params.get('tipo')
        metodo = self.request.query_params.get('metodo_pago')
        if tipo:
            qs = qs.filter(tipo=tipo)
        if metodo:
            qs = qs.filter(metodo_pago=metodo)
        return qs

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)


class SaldoSocioViewSet(viewsets.ModelViewSet):
    queryset = SaldoSocio.objects.select_related('delegate', 'delegate__team').all()
    serializer_class = SaldoSocioSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['delegate__first_name', 'delegate__last_name']


class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.select_related('category').prefetch_related('zones__zone_teams__team').all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return TournamentCreateSerializer
        return TournamentSerializer

    def get_serializer_context(self):
        return super().get_serializer_context()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = TournamentSerializer(instance, context={'request': request})
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        password = (
            request.headers.get('X-Password') or
            request.headers.get('x-password') or
            request.META.get('HTTP_X_PASSWORD') or
            (request.data and isinstance(request.data, dict) and request.data.get('password')) or
            request.query_params.get('password')
        )
        
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'detail': 'INVALID_PASSWORD', 'message': 'Usuario no autenticado.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        if not password or not request.user.check_password(password):
            return Response(
                {'detail': 'INVALID_PASSWORD', 'message': 'No se pudo eliminar el Torneo. Verificá que la contraseña sea correcta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().destroy(request, *args, **kwargs)


class TournamentZoneViewSet(viewsets.ModelViewSet):
    queryset = TournamentZone.objects.select_related('tournament').prefetch_related('zone_teams__team').all()
    serializer_class = TournamentZoneSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        tournament_id = self.request.query_params.get('tournament')
        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        return qs


class ZoneTeamViewSet(viewsets.ModelViewSet):
    queryset = ZoneTeam.objects.select_related('zone', 'team').all()
    serializer_class = ZoneTeamSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        zone_id = self.request.query_params.get('zone')
        if zone_id:
            qs = qs.filter(zone_id=zone_id)
        return qs

    def create(self, request, *args, **kwargs):
        """Support bulk creation: accept a list or a single object."""
        many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        zone = instance.zone
        team = instance.team
        
        from django.db.models import Q
        has_matches = Match.objects.filter(
            Q(match_round__tournament_zone=zone) | Q(impact_zone=zone)
        ).filter(
            Q(local_team=team) | Q(visitor_team=team)
        ).exists()
        
        if has_matches:
            from rest_framework import serializers
            raise serializers.ValidationError({"detail": "No se puede eliminar el equipo de esta zona, ya que tiene partidos cargados en la misma."})
            
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
def caja_resumen(request):
    """Devuelve el resumen de saldos de caja: efectivo, banco y total."""
    from django.db.models import Sum, Q
    from decimal import Decimal

    def safe_sum(qs):
        val = qs.aggregate(total=Sum('monto'))['total']
        return val if val is not None else Decimal('0')

    ingresos_efectivo = safe_sum(Transaccion.objects.filter(tipo='ingreso', metodo_pago='efectivo'))
    ingresos_banco    = safe_sum(Transaccion.objects.filter(tipo='ingreso', metodo_pago='banco'))
    egresos_efectivo  = safe_sum(Transaccion.objects.filter(tipo='egreso',  metodo_pago='efectivo'))
    egresos_banco     = safe_sum(Transaccion.objects.filter(tipo='egreso',  metodo_pago='banco'))

    saldo_efectivo = ingresos_efectivo - egresos_efectivo
    saldo_banco    = ingresos_banco    - egresos_banco
    saldo_total    = saldo_efectivo + saldo_banco

    return Response({
        'saldo_total':    float(saldo_total),
        'saldo_efectivo': float(saldo_efectivo),
        'saldo_banco':    float(saldo_banco),
        'ingresos_total': float(ingresos_efectivo + ingresos_banco),
        'egresos_total':  float(egresos_efectivo  + egresos_banco),
    })


def docx_to_pdf_bytes(docx_file):
    """
    Converts an in-memory DOCX file to PDF bytes using Microsoft Word (docx2pdf)
    to perfectly preserve logos, images, tables, and exact layouts.
    """
    import pythoncom
    try:
        pythoncom.CoInitialize()
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            docx_path = temp_dir_path / "temp.docx"
            pdf_path = temp_dir_path / "temp.pdf"
            
            # Guardar el archivo DOCX subido a disco
            with open(docx_path, 'wb') as out:
                for chunk in docx_file.chunks():
                    out.write(chunk)
                    
            # Convertir usando Microsoft Word en segundo plano
            convert_docx_to_pdf(str(docx_path), str(pdf_path))
            
            # Leer el PDF generado
            if pdf_path.exists():
                with open(pdf_path, 'rb') as pdf_file:
                    buffer = io.BytesIO(pdf_file.read())
                    return buffer
            else:
                return None
    except Exception as e:
        print(f"   [!] Error convirtiendo DOCX a PDF con docx2pdf: {e}")
        return None
    finally:
        try:
            pythoncom.CoUninitialize()
        except:
            pass


# Standard A4 size in PDF points (1 pt = 1/72 inch)
A4_WIDTH = 595.28
A4_HEIGHT = 841.89


def add_page_normalized(writer, source_page):
    """Scale and center source_page to A4 size, preserving aspect ratio."""
    # Resolve page rotation so we use the visual dimensions
    rotation = int(source_page.get('/Rotate') or 0) % 360
    orig_w = float(source_page.mediabox.width)
    orig_h = float(source_page.mediabox.height)

    # Swap w/h when rotated 90° or 270°
    if rotation in (90, 270):
        orig_w, orig_h = orig_h, orig_w

    if orig_w <= 0 or orig_h <= 0:
        writer.add_page(source_page)
        return

    scale = min(A4_WIDTH / orig_w, A4_HEIGHT / orig_h)
    scaled_w = orig_w * scale
    scaled_h = orig_h * scale

    # Center on the A4 page
    tx = (A4_WIDTH - scaled_w) / 2
    ty = (A4_HEIGHT - scaled_h) / 2

    new_page = writer.add_blank_page(width=A4_WIDTH, height=A4_HEIGHT)
    transform = Transformation().scale(scale, scale).translate(tx, ty)
    new_page.merge_transformed_page(source_page, transform)


@api_view(['POST'])
@parser_classes([MultiPartParser])
def merge_pdf(request):
    """
    Receives multiple PDF and DOCX files, merges them in order into one PDF.
    Returns the resulting PDF as a downloadable file.
    """
    files = request.FILES.getlist('files')
    output_name = request.data.get('output_name', 'unificado')

    if not files:
        return Response({'error': 'No se recibieron archivos.'}, status=status.HTTP_400_BAD_REQUEST)

    writer = PdfWriter()
    errors = []

    for f in files:
        name_lower = f.name.lower()
        try:
            if name_lower.endswith('.pdf'):
                reader = PdfReader(f)
                for page in reader.pages:
                    add_page_normalized(writer, page)

            elif name_lower.endswith('.docx'):
                pdf_buffer = docx_to_pdf_bytes(f)
                reader = PdfReader(pdf_buffer)
                for page in reader.pages:
                    add_page_normalized(writer, page)

            elif name_lower.endswith('.doc'):
                errors.append(f"{f.name}: archivos .doc (Word 97) no soportados, usa .docx")
            else:
                errors.append(f"{f.name}: formato no soportado (usa PDF o DOCX)")

        except Exception as e:
            errors.append(f"{f.name}: {str(e)}")

    if len(writer.pages) == 0:
        return Response({'error': 'No se pudo extraer ninguna página.', 'detalles': errors},
                        status=status.HTTP_400_BAD_REQUEST)

    safe_name = output_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
    filename = f"{safe_name}.pdf"

    # Save to media/temp/ so the browser can download via a real HTTP URL
    temp_dir = Path(settings.MEDIA_ROOT) / 'temp'
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Clean up temp files older than 30 minutes
    import time as _time
    now = _time.time()
    for old in temp_dir.glob('*.pdf'):
        try:
            if now - old.stat().st_mtime > 1800:
                old.unlink(missing_ok=True)
        except Exception:
            pass

    temp_path = temp_dir / filename
    with open(temp_path, 'wb') as out:
        writer.write(out)

    download_url = request.build_absolute_uri(f'/api/download/{filename}/')

    return Response({
        'filename': filename,
        'download_url': download_url,
        'pages': len(writer.pages),
        'warnings': errors,
    })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def download_temp(request, filename):
    """Serve a merged temp PDF or ZIP with Content-Disposition: attachment so the
    browser downloads it with the correct filename regardless of browser version."""
    from django.http import FileResponse

    safe = os.path.basename(filename)
    if not (safe.endswith('.pdf') or safe.endswith('.zip')):
        return Response({'error': 'Archivo no válido.'}, status=status.HTTP_400_BAD_REQUEST)

    file_path = Path(settings.MEDIA_ROOT) / 'temp' / safe
    if not file_path.exists():
        return Response({'error': 'Archivo no encontrado. Volvé a generar el documento.'}, status=status.HTTP_404_NOT_FOUND)

    content_type = 'application/zip' if safe.endswith('.zip') else 'application/pdf'
    return FileResponse(
        open(file_path, 'rb'),
        content_type=content_type,
        as_attachment=True,
        filename=safe,
    )

@api_view(['POST'])
@parser_classes([MultiPartParser])
def add_to_zip_session(request):
    """
    Agrega archivos de un paciente a un archivo ZIP de sesión.
    Si el ZIP no existe, lo crea.
    """
    files = request.FILES.getlist('files')
    session_id = request.data.get('session_id')
    patient_name = request.data.get('patient_name')
    root_folder = request.data.get('root_folder', 'Pacientes')

    if not files or not session_id or not patient_name:
        return Response({'error': 'Faltan datos de sesión.'}, status=status.HTTP_400_BAD_REQUEST)

    temp_dir = Path(settings.MEDIA_ROOT) / 'temp'
    temp_dir.mkdir(parents=True, exist_ok=True)
    zip_path = temp_dir / f"{session_id}.zip"

    # Procesar archivos del paciente
    writer = PdfWriter()
    # Los archivos ya vienen filtrados por el frontend para este paciente
    for f in sorted(files, key=lambda x: x.name.lower()):
        name_lower = f.name.lower()
        try:
            if name_lower.endswith('.pdf'):
                reader = PdfReader(f)
                for page in reader.pages:
                    add_page_normalized(writer, page)
            elif name_lower.endswith('.docx'):
                pdf_buffer = docx_to_pdf_bytes(f)
                if pdf_buffer:
                    reader = PdfReader(pdf_buffer)
                    for page in reader.pages:
                        add_page_normalized(writer, page)
        except Exception as e:
            print(f"Error en {patient_name}: {e}")

    if len(writer.pages) > 0:
        output_buffer = io.BytesIO()
        writer.write(output_buffer)
        output_buffer.seek(0)
        
        # Escribir al ZIP (abrimos en modo 'a' para agregar)
        mode = 'a' if zip_path.exists() else 'w'
        with zipfile.ZipFile(zip_path, mode, zipfile.ZIP_DEFLATED) as zipf:
            zip_internal_path = f"{root_folder}/{patient_name}/{patient_name}.pdf"
            zipf.writestr(zip_internal_path, output_buffer.read())

        download_url = request.build_absolute_uri(f'/api/download/{session_id}.zip/')
    return Response({'status': 'ok', 'download_url': download_url})


class CarouselImageViewSet(viewsets.ModelViewSet):
    queryset = CarouselImage.objects.all()
    serializer_class = CarouselImageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

from .models import News
from .serializers import NewsSerializer

class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all()
    serializer_class = NewsSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['title', 'excerpt']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class MatchRoundViewSet(viewsets.ModelViewSet):
    queryset = MatchRound.objects.prefetch_related('matches__local_team', 'matches__visitor_team').all()
    serializer_class = MatchRoundSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        zone_id = self.request.query_params.get('tournament_zone')
        if zone_id:
            qs = qs.filter(tournament_zone_id=zone_id)
        return qs.order_by('order')


def recalculate_tournament_standings_and_stats(tournament):
    if not tournament:
        return

    # 1. Update ZoneTeam standings for all zones in the tournament
    for zone in tournament.zones.all():
        for zt in zone.zone_teams.all():
            team = zt.team
            matches = Match.objects.filter(
                models.Q(impact_zone=zone) | (models.Q(impact_zone__isnull=True) & models.Q(match_round__tournament_zone=zone))
            ).filter(
                models.Q(local_team=team) | models.Q(visitor_team=team)
            ).filter(played=True)

            played_count = 0
            won = 0
            drawn = 0
            lost = 0
            gf = 0
            ga = 0

            for m in matches:
                played_count += 1
                is_local = (m.local_team_id == team.id)
                
                # Check for walkover / points awarded
                if m.points_awarded_to_id:
                    if m.points_awarded_to_id == team.id:
                        won += 1
                    else:
                        lost += 1
                elif m.local_score is not None and m.visitor_score is not None:
                    team_score = m.local_score if is_local else m.visitor_score
                    opp_score = m.visitor_score if is_local else m.local_score
                    gf += team_score
                    ga += opp_score
                    if team_score > opp_score:
                        won += 1
                    elif team_score == opp_score:
                        drawn += 1
                    else:
                        lost += 1

            pts = (won * tournament.pts_win) + (drawn * tournament.pts_draw) + (lost * tournament.pts_loss)
            
            stats = MatchPlayerStat.objects.filter(
                match__in=matches,
                team=team
            )
            yellow_count = stats.filter(yellow_card=True).count()
            red_count = stats.filter(red_card=True).count()
            fp = (yellow_count * tournament.fp_yellow_pts) + (red_count * tournament.fp_red_pts)

            zt.played = played_count
            zt.won = won
            zt.drawn = drawn
            zt.lost = lost
            zt.goals_for = gf
            zt.goals_against = ga
            zt.points = pts
            zt.yellow_cards = yellow_count
            zt.red_cards = red_count
            zt.fair_play = fp
            zt.save()

    # 2. Sync Goleador table
    player_goals = (
        MatchPlayerStat.objects.filter(
            match__match_round__tournament_zone__tournament=tournament,
            goals__gt=0
        )
        .values('player', 'team')
        .annotate(total_goals=models.Sum('goals'))
    )
    
    active_goleador_keys = set()
    for entry in player_goals:
        player_id = entry['player']
        team_id = entry['team']
        total = entry['total_goals']
        player_obj = Player.objects.filter(id=player_id).first()
        p_name = f"{player_obj.first_name} {player_obj.last_name}".strip() if player_obj else f"Jugador {player_id}"
        
        Goleador.objects.update_or_create(
            tournament=tournament,
            team_id=team_id,
            player_name=p_name,
            defaults={'goals': total}
        )
        active_goleador_keys.add((team_id, p_name))

    for g in Goleador.objects.filter(tournament=tournament):
        if (g.team_id, g.player_name) not in active_goleador_keys:
            g.delete()

    # 3. Sync Sancionado table
    red_stats = MatchPlayerStat.objects.filter(
        match__match_round__tournament_zone__tournament=tournament,
        red_card=True
    ).select_related('player', 'team')
    
    active_sancionados_keys = set()
    for s in red_stats:
        p_name = f"{s.player.first_name} {s.player.last_name}".strip()
        parts = []
        if s.red_card_suspension_dates:
            parts.append(f"{s.red_card_suspension_dates} fechas")
        if s.red_card_reason:
            parts.append(s.red_card_reason)
        reason_str = " - ".join(parts) if parts else "Tarjeta Roja"
        
        Sancionado.objects.update_or_create(
            tournament=tournament,
            team=s.team,
            player_name=p_name,
            defaults={'reason': reason_str}
        )
        active_sancionados_keys.add((s.team_id, p_name))

    for sc in Sancionado.objects.filter(tournament=tournament):
        if (sc.team_id, sc.player_name) not in active_sancionados_keys:
            sc.delete()


class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'], url_path='save-result')
    def save_result(self, request, pk=None):
        match = self.get_object()
        data = request.data

        with transaction.atomic():
            local_score = data.get('local_score')
            visitor_score = data.get('visitor_score')
            penalties = data.get('penalties', False)
            local_penalties = data.get('local_penalties')
            visitor_penalties = data.get('visitor_penalties')
            match_status = data.get('status', 'FINALIZADO')
            points_awarded_to = data.get('points_awarded_to')
            player_stats = data.get('player_stats', [])

            match.local_score = int(local_score) if local_score is not None and str(local_score).strip() != '' else None
            match.visitor_score = int(visitor_score) if visitor_score is not None and str(visitor_score).strip() != '' else None
            match.penalties = bool(penalties)
            match.local_penalties = int(local_penalties) if penalties and local_penalties is not None and str(local_penalties).strip() != '' else None
            match.visitor_penalties = int(visitor_penalties) if penalties and visitor_penalties is not None and str(visitor_penalties).strip() != '' else None
            match.status = match_status
            match.points_awarded_to_id = points_awarded_to if points_awarded_to else None
            match.played = (match_status == 'FINALIZADO' or match.local_score is not None or match.points_awarded_to_id is not None)
            match.save()

            # Replace player stats for this match
            MatchPlayerStat.objects.filter(match=match).delete()
            stats_to_create = []
            for ps in player_stats:
                played_flag = ps.get('played', False)
                goals_val = int(ps.get('goals') or 0)
                yellow_val = bool(ps.get('yellow_card', False))
                red_val = bool(ps.get('red_card', False))
                figura_val = bool(ps.get('is_figura', False))

                if played_flag or goals_val > 0 or yellow_val or red_val or figura_val:
                    stats_to_create.append(MatchPlayerStat(
                        match=match,
                        player_id=ps['player'],
                        team_id=ps['team'],
                        goals=goals_val,
                        yellow_card=yellow_val,
                        red_card=red_val,
                        red_card_suspension_dates=str(ps.get('red_card_suspension_dates') or '').strip() or None,
                        red_card_reason=str(ps.get('red_card_reason') or '').strip() or None,
                        is_figura=figura_val,
                        played=played_flag or goals_val > 0 or yellow_val or red_val or figura_val
                    ))

            if stats_to_create:
                MatchPlayerStat.objects.bulk_create(stats_to_create)

            # Auto recalculate standings & stats
            tournament = match.match_round.tournament_zone.tournament
            recalculate_tournament_standings_and_stats(tournament)

        serializer = self.get_serializer(match)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='clear-result')
    def clear_result(self, request, pk=None):
        match = self.get_object()

        with transaction.atomic():
            match.local_score = None
            match.visitor_score = None
            match.played = False
            match.status = 'PENDIENTE'
            match.penalties = False
            match.local_penalties = None
            match.visitor_penalties = None
            match.points_awarded_to = None
            match.save()

            MatchPlayerStat.objects.filter(match=match).delete()

            tournament = match.match_round.tournament_zone.tournament
            recalculate_tournament_standings_and_stats(tournament)

        serializer = self.get_serializer(match)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GoleadorViewSet(viewsets.ModelViewSet):
    queryset = Goleador.objects.select_related('team', 'tournament').all()
    serializer_class = GoleadorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        tournament_id = self.request.query_params.get('tournament')
        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        return qs


class VallaMenosVencidaViewSet(viewsets.ModelViewSet):
    queryset = VallaMenosVencida.objects.select_related('team', 'tournament').all()
    serializer_class = VallaMenosVencidaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        tournament_id = self.request.query_params.get('tournament')
        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        return qs


class SancionadoViewSet(viewsets.ModelViewSet):
    queryset = Sancionado.objects.select_related('team', 'tournament').all()
    serializer_class = SancionadoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        tournament_id = self.request.query_params.get('tournament')
        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        return qs


from rest_framework.permissions import IsAuthenticated

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'dni']

    def perform_update(self, serializer):
        remove_photo = self.request.data.get('remove_photo') == 'true'
        remove_dni_front = self.request.data.get('remove_dni_front') == 'true'
        remove_dni_back = self.request.data.get('remove_dni_back') == 'true'
        
        player = serializer.instance
        if remove_photo:
            player.photo = None
        if remove_dni_front:
            player.dni_front = None
        if remove_dni_back:
            player.dni_back = None
            
        serializer.save()


class GoodFaithListViewSet(viewsets.ModelViewSet):
    queryset = GoodFaithList.objects.select_related('player', 'team', 'tournament').all()
    serializer_class = GoodFaithListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        tournament_id = self.request.query_params.get('tournament')
        team_id = self.request.query_params.get('team')
        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        if team_id:
            qs = qs.filter(team_id=team_id)
        return qs
