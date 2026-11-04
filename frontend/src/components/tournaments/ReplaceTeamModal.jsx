import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ArrowRight, ArrowLeftRight, Check, Edit2 } from 'lucide-react';
import api from '../../api';
import { Modal, errMsg, ars } from '../finanzas/common';
import TeamForm from '../teams/TeamForm';

const btnOutline = {
  height: 34,
  padding: '0 12px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  background: '#ffffff',
  color: '#18181b',
  border: '1px solid #d4d3ce',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  gap: 6,
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  boxSizing: 'border-box'
};

const btnDark = {
  height: 34,
  padding: '0 12px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  background: '#141413',
  color: '#ffffff',
  border: '1px solid #141413',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  gap: 6,
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  boxSizing: 'border-box'
};

const tagPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 500,
  padding: '2px 7px',
  borderRadius: 6,
  background: '#f1f0ec',
  color: '#52514e',
  border: 'none',
};

const tagBlue = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#dbeafe',
  color: '#1d4ed8',
};

export default function ReplaceTeamModal({
  zoneTeam,
  zone,
  categoryId,
  onClose,
  onSuccess,
}) {
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [inheritPoints, setInheritPoints] = useState(false);
  const [reason, setReason] = useState('Expulsión disciplinaria');
  const [note, setNote] = useState('');
  const [registrationFee, setRegistrationFee] = useState(0);
  const [editingFee, setEditingFee] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [err, setErr] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const existingZoneTeamIds = useMemo(() => {
    if (!zone?.zone_teams) return new Set();
    return new Set(zone.zone_teams.map((zt) => zt.team));
  }, [zone]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        const res = await api.get('teams/');
        setAllTeams(res.data || []);
      } catch (e) {
        setErr(errMsg(e));
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  const availableTeams = useMemo(() => {
    return allTeams
      .filter((t) => {
        if (existingZoneTeamIds.has(t.id) || t.id === zoneTeam.team) return false;
        if (categoryId) {
          return Number(t.category) === Number(categoryId);
        }
        return true;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allTeams, existingZoneTeamIds, zoneTeam.team, categoryId]);

  const selectedTeamObj = useMemo(
    () => allTeams.find((t) => String(t.id) === String(selectedTeamId)),
    [allTeams, selectedTeamId],
  );

  const handleCreatedTeam = (newTeam) => {
    setAllTeams((prev) => [newTeam, ...prev]);
    setSelectedTeamId(newTeam.id);
    setShowCreateTeam(false);
  };

  const submit = async () => {
    if (!selectedTeamId) {
      setErr('Seleccioná un equipo entrante.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const res = await api.post(`zone-teams/${zoneTeam.id}/replace-team/`, {
        new_team_id: Number(selectedTeamId),
        inherit_points: inheritPoints,
        reason,
        note: note.trim(),
        registration_fee: Number(registrationFee) || 0,
      });
      onSuccess?.(res.data);
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.error || errMsg(e));
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        title="Reemplazar Equipo"
        onClose={onClose}
        width={460}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 1. Tarjeta compacta del equipo saliente */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: '#faf9f6',
              border: '1px solid #e6e4dd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10.5, color: '#787772', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Sale:
                </span>
                <strong style={{ fontSize: 13.5, color: '#141413', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {zoneTeam.team_name}
                </strong>
              </div>
              <div style={{ fontSize: 11, color: '#6b6a65', marginTop: 2 }}>
                {zoneTeam.points ?? 0} pts • {zoneTeam.played ?? 0} PJ • {zoneTeam.fair_play ?? 0} Fair Play
              </div>
            </div>
            <span style={tagBlue}>{zone?.name || 'Zona'}</span>
          </div>

          {/* 2. Equipo entrante */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#52514e', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Equipo entrante *
              </label>
              <button
                type="button"
                onClick={() => setShowCreateTeam(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#cc7a5c',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Nuevo equipo
              </button>
            </div>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid #d4d3ce',
                padding: '0 8px',
                background: '#ffffff',
                color: '#141413',
                boxSizing: 'border-box',
              }}
            >
              <option value="">
                {loadingTeams ? 'Cargando equipos…' : 'Seleccionar equipo…'}
              </option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.category_name ? `(${t.category_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Pregunta Sí / No: Conservar puntos */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: '#faf9f6',
              border: '1px solid #e6e4dd',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#141413', lineHeight: 1.3 }}>
              ¿Conserva los puntos del equipo saliente?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setInheritPoints(true)}
                style={{
                  ...(inheritPoints ? btnDark : btnOutline),
                  height: 32,
                  justifyContent: 'center',
                  width: '100%',
                  fontSize: 11.5,
                  padding: '0 4px',
                }}
              >
                {inheritPoints && <Check size={12} />} Sí ({zoneTeam.points ?? 0} pts)
              </button>
              <button
                type="button"
                onClick={() => setInheritPoints(false)}
                style={{
                  ...(!inheritPoints ? btnDark : btnOutline),
                  height: 32,
                  justifyContent: 'center',
                  width: '100%',
                  fontSize: 11.5,
                  padding: '0 4px',
                }}
              >
                {!inheritPoints && <Check size={12} />} No (desde 0)
              </button>
            </div>
          </div>

          {/* 4. Motivo y observación */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#6b6a65', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Motivo del reemplazo
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  height: 34,
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #d4d3ce',
                  padding: '0 8px',
                  background: '#ffffff',
                  color: '#141413',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Expulsión disciplinaria">Expulsión disciplinaria</option>
                <option value="Abandono del torneo">Abandono del torneo</option>
                <option value="Baja por mutuo acuerdo / Fuerza mayor">Baja por mutuo acuerdo</option>
                <option value="Otro">Otro motivo</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#6b6a65', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Observación (opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Detalle o nota interna..."
                style={{
                  width: '100%',
                  height: 34,
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #d4d3ce',
                  padding: '0 8px',
                  background: '#ffffff',
                  color: '#141413',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* 5. Vista previa del impacto con botón editable de Valor Inscripción */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: '#f5f4f0',
              border: '1px solid #e6e4dd',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, minWidth: 0, flex: 1 }}>
                <span style={{ color: '#787772', textDecoration: 'line-through', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '110px' : 'none' }}>
                  {zoneTeam.team_name}
                </span>
                <ArrowRight size={13} style={{ color: '#787772', flexShrink: 0 }} />
                <strong style={{ fontSize: '0.9rem', fontWeight: 700, color: '#141413', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '130px' : 'none' }}>
                  {selectedTeamObj ? selectedTeamObj.name : 'Equipo entrante'}
                </strong>
              </div>

              <span style={inheritPoints ? tagBlue : tagPill}>
                {inheritPoints ? `Hereda ${zoneTeam.points ?? 0} pts` : 'Arranca 0 pts'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e6e4dd', paddingTop: 6, width: '100%' }}>
              <span style={{ fontSize: 11.5, color: '#6b6a65', fontWeight: 600 }}>Valor Inscripción:</span>

              {editingFee ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11.5, color: '#6b6a65', fontWeight: 600 }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    autoFocus
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(Math.max(0, Number(e.target.value) || 0))}
                    onBlur={() => setEditingFee(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingFee(false);
                    }}
                    style={{
                      width: 80,
                      height: 26,
                      padding: '0 6px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: '1px solid #141413',
                      background: '#ffffff',
                      color: '#141413',
                      textAlign: 'right',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingFee(false)}
                    style={{ ...btnDark, height: 26, padding: '0 8px', fontSize: 11 }}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingFee(true)}
                  style={{
                    ...btnOutline,
                    height: 26,
                    padding: '0 8px',
                    fontSize: 11,
                    gap: 4,
                    background: Number(registrationFee) > 0 ? '#dcfce7' : '#ffffff',
                    borderColor: Number(registrationFee) > 0 ? '#bbf7d0' : '#d4d3ce',
                    color: Number(registrationFee) > 0 ? '#166534' : '#141413',
                    cursor: 'pointer',
                  }}
                  title="Clic para editar el valor de inscripción"
                >
                  <strong>{ars(registrationFee)}</strong>
                  <Edit2 size={10} style={{ opacity: 0.6 }} />
                </button>
              )}
            </div>
          </div>

          {err && <div style={{ color: '#dc2626', fontSize: 12 }}>{err}</div>}

          {/* 6. Botones de acción */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              style={{
                ...btnOutline,
                height: 38,
                flex: 1,
                justifyContent: 'center',
              }}
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              style={{
                ...btnDark,
                height: 38,
                flex: 2,
                justifyContent: 'center',
              }}
              onClick={submit}
              disabled={saving || !selectedTeamId}
            >
              <ArrowLeftRight size={14} /> {saving ? 'Guardando…' : 'Confirmar reemplazo'}
            </button>
          </div>
        </div>
      </Modal>

      {showCreateTeam && (
        <Modal
          title="Nuevo Equipo"
          onClose={() => setShowCreateTeam(false)}
          width={680}
        >
          <TeamForm
            isModal={true}
            defaultCategoryId={categoryId}
            onClose={() => setShowCreateTeam(false)}
            onSuccess={handleCreatedTeam}
          />
        </Modal>
      )}
    </>
  );
}
