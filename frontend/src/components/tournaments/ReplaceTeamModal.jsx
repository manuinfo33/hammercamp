import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ArrowRight, ArrowLeftRight, Check, Edit2 } from 'lucide-react';
import api from '../../api';
import { Field, Modal, errMsg, ars } from '../finanzas/common';
import TeamForm from '../teams/TeamForm';

const btnOutline = {
  height: 32,
  padding: '0 12px',
  borderRadius: 8,
  fontSize: 12.5,
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
};

const btnDark = {
  height: 34,
  padding: '0 14px',
  borderRadius: 8,
  fontSize: 12.5,
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
};

const tagPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11.5,
  fontWeight: 500,
  padding: '3px 8px',
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
        title={`Reemplazar equipo — ${zoneTeam.team_name}`}
        onClose={onClose}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Cabecera resumen estilo Finanzas */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: '#faf9f6',
              border: '1px solid #e6e4dd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#6b6a65', fontWeight: 500 }}>
                Equipo saliente
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#141413', marginTop: 2 }}>
                {zoneTeam.team_name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={tagBlue}>{zone?.name || 'Zona'}</span>
              <div style={{ fontSize: 12, color: '#6b6a65', marginTop: 4 }}>
                {zoneTeam.points ?? 0} pts · {zoneTeam.played ?? 0} PJ · {zoneTeam.fair_play ?? 0} FP
              </div>
            </div>
          </div>

          {/* Equipo entrante */}
          <Field label="Equipo entrante">
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                style={{ flex: 1 }}
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
              <button
                type="button"
                style={{ ...btnOutline, height: 38, flexShrink: 0 }}
                onClick={() => setShowCreateTeam(true)}
              >
                <Plus size={14} /> Nuevo equipo
              </button>
            </div>
          </Field>

          {/* Pregunta Sí / No: Conservar puntos */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: '#faf9f6',
              border: '1px solid #e6e4dd',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#141413' }}>
              ¿Desea que el equipo nuevo conserve los puntos del equipo actual?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setInheritPoints(true)}
                style={{
                  ...(inheritPoints ? btnDark : btnOutline),
                  height: 34,
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                {inheritPoints && <Check size={13} />} Sí, conservar ({zoneTeam.points ?? 0} pts)
              </button>
              <button
                type="button"
                onClick={() => setInheritPoints(false)}
                style={{
                  ...(!inheritPoints ? btnDark : btnOutline),
                  height: 34,
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                {!inheritPoints && <Check size={13} />} No, comenzar de 0 pts
              </button>
            </div>
          </div>

          {/* Motivo y observación */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Motivo del reemplazo">
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="Expulsión disciplinaria">Expulsión disciplinaria</option>
                <option value="Abandono del torneo">Abandono del torneo</option>
                <option value="Baja por mutuo acuerdo / Fuerza mayor">Baja por mutuo acuerdo</option>
                <option value="Otro">Otro motivo</option>
              </select>
            </Field>

            <Field label="Observación (opcional)">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          </div>

          {/* Vista previa del impacto con botón editable de Valor Inscripción */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: '#f5f4f0',
              border: '1px solid #e6e4dd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span style={{ color: '#787772', textDecoration: 'line-through' }}>
                {zoneTeam.team_name}
              </span>
              <ArrowRight size={14} style={{ color: '#787772' }} />
              <strong style={{ fontSize: '0.98rem', fontWeight: 700, color: '#141413' }}>
                {selectedTeamObj ? selectedTeamObj.name : 'Equipo entrante'}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={inheritPoints ? tagBlue : tagPill}>
                {inheritPoints ? `Hereda ${zoneTeam.points ?? 0} pts` : 'Arranca 0 pts'}
              </span>

              {editingFee ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
                      width: 90,
                      height: 28,
                      padding: '0 8px',
                      fontSize: 12,
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
                    style={{ ...btnDark, height: 28, padding: '0 8px', fontSize: 11.5 }}
                  >
                    Listo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingFee(true)}
                  style={{
                    ...btnOutline,
                    height: 28,
                    padding: '0 10px',
                    fontSize: 11.5,
                    gap: 6,
                    background: Number(registrationFee) > 0 ? '#dcfce7' : '#faf9f6',
                    borderColor: Number(registrationFee) > 0 ? '#bbf7d0' : '#d4d3ce',
                    color: Number(registrationFee) > 0 ? '#166534' : '#141413',
                    cursor: 'pointer',
                  }}
                  title="Clic para editar el valor de inscripción"
                >
                  <span>Valor Inscripción:</span>
                  <strong>{ars(registrationFee)}</strong>
                  <Edit2 size={11} style={{ opacity: 0.6, marginLeft: 2 }} />
                </button>
              )}
            </div>
          </div>

          {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" style={btnOutline} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              type="button"
              style={btnDark}
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
