import React, { useState, useRef } from 'react';
import api from '../api';
import {
  FileText, File, X, GripVertical, Download, Loader2,
  FolderOpen, AlertCircle, CheckCircle2, ArrowUp, ArrowDown, FolderPlus
} from 'lucide-react';

const UnirPDF = ({ onClose }) => {
  const [files, setFiles] = useState([]);
  const [groups, setGroups] = useState({}); // { patientName: [file1, file2] }
  const [outputName, setOutputName] = useState('documento_unificado');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [downloadReady, setDownloadReady] = useState(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const singleFolderInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const valid = selected.filter(f =>
      f.name.toLowerCase().endsWith('.pdf') ||
      f.name.toLowerCase().endsWith('.docx')
    );
    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, id: Math.random() }))]);
    setGroups({}); 
    e.target.value = '';
  };

  const handleSingleFolderSelect = (e) => {
    const allFiles = Array.from(e.target.files);
    const valid = allFiles.filter(f =>
      f.name.toLowerCase().endsWith('.pdf') ||
      f.name.toLowerCase().endsWith('.docx')
    );
    
    if (valid.length > 0) {
      // Sort them by path/name to have some order
      valid.sort((a, b) => a.webkitRelativePath.localeCompare(b.webkitRelativePath));
      setFiles(valid.map(f => ({ file: f, id: Math.random() })));
      setGroups({}); // Clear batch mode
      setResult({ type: 'success', message: `Se detectaron ${valid.length} archivos en total para unificar en un solo PDF.` });
    } else {
      setResult({ type: 'error', message: 'No se encontraron archivos PDF o DOCX en la carpeta seleccionada.' });
    }
    e.target.value = '';
  };

  const handleFolderSelect = (e) => {
    const allFiles = Array.from(e.target.files);
    const newGroups = {};
    
    allFiles.forEach(f => {
      const path = f.webkitRelativePath || '';
      const parts = path.split('/');
      
      // If path is root/PatientName/file.pdf, parts.length is 3
      if (parts.length >= 2) {
        const patientName = parts[parts.length - 2];
        const isExt = f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx');
        
        if (isExt && patientName !== parts[0]) { // Ignore files in the root folder itself
          if (!newGroups[patientName]) newGroups[patientName] = [];
          newGroups[patientName].push(f);
        }
      }
    });

    if (Object.keys(newGroups).length > 0) {
      setGroups(newGroups);
      setFiles([]); // Clear individual files if folder is selected
      setResult({ type: 'success', message: `Se detectaron ${Object.keys(newGroups).length} pacientes en la carpeta.` });
    } else {
      setResult({ type: 'error', message: 'No se encontraron subcarpetas con archivos PDF o DOCX válidos.' });
    }
    e.target.value = '';
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  const moveFile = (idx, dir) => {
    const newFiles = [...files];
    const target = idx + dir;
    if (target < 0 || target >= newFiles.length) return;
    [newFiles[idx], newFiles[target]] = [newFiles[target], newFiles[idx]];
    setFiles(newFiles);
  };

  const getIcon = (name) => {
    if (name.toLowerCase().endsWith('.pdf')) return <FileText size={16} className="pdf-icon" />;
    return <File size={16} className="docx-icon" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  const [progress, setProgress] = useState(null);

  const handleMerge = async () => {    const isBatch = Object.keys(groups).length > 0;
    const itemsToProcess = isBatch ? Object.entries(groups) : [['Manual', files.map(f => f.file)]];

    if (itemsToProcess.length === 0 || (isBatch && Object.keys(groups).length === 0) || (!isBatch && files.length === 0)) {
      setResult({ type: 'error', message: 'No hay archivos para procesar.' });
      return;
    }

    setLoading(true);
    setResult(null);
    setDownloadReady(null);
    setProgress({ current: 0, total: itemsToProcess.length });

    // Generate a session ID for the ZIP
    const timestamp = Math.floor(Date.now() / 1000);
    const rootFolderName = isBatch ? (itemsToProcess[0][1][0].webkitRelativePath.split('/')[0] || 'Pacientes') : 'Documentos';
    const sessionId = `${rootFolderName.replace(/\s/g, '_')}_${timestamp}`;

    let successCount = 0;
    let errors = [];
    let finalDownloadUrl = null;

    try {
      for (let i = 0; i < itemsToProcess.length; i++) {
        const [name, fileList] = itemsToProcess[i];
        setProgress({ current: i + 1, total: itemsToProcess.length, name });

        const formData = new FormData();
        fileList.forEach(file => formData.append('files', file));
        
        const endpoint = isBatch 
          ? 'add-to-zip-session/' 
          : 'merge-pdf/';

        if (isBatch) {
          formData.append('session_id', sessionId);
          formData.append('patient_name', name);
          formData.append('root_folder', rootFolderName);
        } else {
          formData.append('output_name', (outputName || 'documento_unificado').trim());
        }

        try {
          const response = await api.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const data = response.data;

          if (response.status >= 200 && response.status < 300) {
            successCount++;
            if (!isBatch) {
              // Manual mode: single PDF download ready
              setDownloadReady({ url: data.download_url, filename: data.filename });
            } else {
              // Batch mode: cumulative ZIP
              finalDownloadUrl = data.download_url;
            }
            // Small pause to let CPU breathe
            if (isBatch) await new Promise(r => setTimeout(r, 600));
          } else {
            errors.push(`${name}: ${data.error || 'Error'}`);
          }
        } catch (err) {
          const errorMsg = err.response?.data?.error || 'Error de conexión';
          errors.push(`${name}: ${errorMsg}`);
        }
      }

      if (successCount > 0) {
        if (isBatch) {
          setDownloadReady({ url: finalDownloadUrl, filename: `${sessionId}.zip` });
        }
        setResult({
          type: errors.length > 0 ? 'warning' : 'success',
          message: isBatch 
            ? `✓ ¡Listo! Se procesaron ${successCount} pacientes correctamente en el archivo ZIP.`
            : `✓ ¡Listo! El archivo PDF ha sido generado.`,
        });
      } else {
        setResult({ type: 'error', message: 'No se pudo procesar ningún archivo.\n' + errors.join('\n') });
      }
    } catch (err) {
      console.error('Merge error:', err);
      setResult({ type: 'error', message: 'Error crítico en el proceso.' });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 2000, 
      backdropFilter: 'blur(8px)', 
      padding: '40px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px', 
        padding: '40px', 
        width: '100%', 
        maxWidth: '680px',
        maxHeight: '85vh', 
        overflowY: 'auto', 
        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        position: 'relative',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border-medium) transparent'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Unir PDF / Modo Masivo
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
              Uní archivos individuales o seleccioná una carpeta con subcarpetas de pacientes
            </p>
          </div>
          <button type="button" onClick={onClose} className="secondary"
            style={{ minWidth: 'auto', width: '32px', height: '32px', padding: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ flex: 1, height: '60px', background: 'var(--brand-beige-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRadius: '12px' }}
          >
            <FileText size={18} color="var(--brand-beige)" />
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Archivos</span>
          </button>
          <button
            type="button"
            onClick={() => singleFolderInputRef.current?.click()}
            style={{ flex: 1, height: '60px', background: 'var(--brand-beige-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRadius: '12px' }}
          >
            <FolderPlus size={18} color="var(--brand-beige-light)" />
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Carpeta (1 PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            style={{ flex: 1, height: '60px', background: 'var(--brand-beige-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRadius: '12px' }}
          >
            <FolderOpen size={18} color="var(--brand-beige-dim)" />
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Carpeta (Masivo)</span>
          </button>
        </div>

        <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx" style={{ display: 'none' }} onChange={handleFileSelect} />
        <input ref={singleFolderInputRef} type="file" webkitdirectory="" directory="" style={{ display: 'none' }} onChange={handleSingleFolderSelect} />
        <input ref={folderInputRef} type="file" webkitdirectory="" directory="" style={{ display: 'none' }} onChange={handleFolderSelect} />

        {/* Progress Indicator */}
        {progress && (
          <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--brand-beige-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--brand-beige-light)', fontWeight: '700' }}>Procesando {progress.current} de {progress.total}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--brand-beige)', width: `${(progress.current / progress.total) * 100}%`, transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
              Actual: {progress.name || 'Iniciando...'}
            </p>
          </div>
        )}

        {/* Groups list (Patient Mode) */}
        {Object.keys(groups).length > 0 && (
          <div style={{ marginBottom: '20px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: '700' }}>
              Pacientes detectados ({Object.keys(groups).length})
            </p>
            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.keys(groups).sort().map(name => (
                <div key={name} style={{ fontSize: '12px', color: 'var(--text-primary)', padding: '6px 10px', background: 'var(--brand-beige-subtle)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{groups[name].length} archivos</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File list (Manual Mode) */}
        {files.length > 0 && Object.keys(groups).length === 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: '700' }}>
              {files.length} archivo(s) — se unirán en este orden
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {files.map(({ file, id }, idx) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'var(--brand-beige-subtle)', borderRadius: '10px',
                  padding: '10px 12px', border: '1px solid var(--border-subtle)'
                }}>
                  <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ color: file.name.endsWith('.pdf') ? 'var(--brand-beige)' : 'var(--brand-beige-light)', flexShrink: 0 }}>
                    {getIcon(file.name)}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {formatSize(file.size)}
                  </span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button type="button" onClick={() => moveFile(idx, -1)} className="secondary"
                      style={{ minWidth: 'auto', height: '24px', width: '24px', padding: 0, opacity: idx === 0 ? 0.3 : 1 }}>
                      <ArrowUp size={11} />
                    </button>
                    <button type="button" onClick={() => moveFile(idx, 1)} className="secondary"
                      style={{ minWidth: 'auto', height: '24px', width: '24px', padding: 0, opacity: idx === files.length - 1 ? 0.3 : 1 }}>
                      <ArrowDown size={11} />
                    </button>
                  </div>
                  <button type="button" onClick={() => removeFile(id)} className="danger"
                    style={{ minWidth: 'auto', height: '24px', width: '24px', padding: 0 }}>
                    <X size={11} style={{ pointerEvents: 'none' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output name (Only show in Manual Mode) */}
        {Object.keys(groups).length === 0 && (
          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Nombre del archivo de salida
            </label>
            <input
              type="text"
              value={outputName}
              onChange={e => setOutputName(e.target.value)}
              placeholder="documento_unificado"
              style={{ height: '42px', borderColor: 'var(--border-subtle)' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Se guardará como <strong>{outputName || 'documento_unificado'}.pdf</strong> en tu carpeta de Descargas</span>
          </div>
        )}

        {/* Result message */}
        {result && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
            background: result.type === 'success' ? 'rgba(34,197,94,0.1)' : result.type === 'warning' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.type === 'success' ? 'rgba(34,197,94,0.3)' : result.type === 'warning' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: result.type === 'success' ? '#4ade80' : result.type === 'warning' ? '#fbbf24' : '#f87171',
            fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'flex-start', whiteSpace: 'pre-line'
          }}>
            {result.type === 'success' ? <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px' }} /> : <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />}
            <span>{result.message}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={onClose} className="secondary" style={{ height: '44px' }}>
            Cerrar
          </button>

          {/* window.location.href to the backend download URL.
              Chrome strips the 'download' attribute on cross-origin <a> tags,
              but window.location.href + Content-Disposition: attachment works perfectly. */}
          {downloadReady && (
            <button
              type="button"
              onClick={() => { window.location.href = downloadReady.url; }}
              style={{
                height: '44px', padding: '0 22px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white', border: 'none', display: 'inline-flex',
                alignItems: 'center', gap: '8px', fontSize: '14px',
                fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 6px 16px -4px rgba(34,197,94,0.5)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            >
              <Download size={16} /> Guardar PDF ({downloadReady.filename})
            </button>
          )}

          <button
            type="button"
            onClick={handleMerge}
            disabled={loading || (files.length === 0 && Object.keys(groups).length === 0)}
            style={{ height: '44px', opacity: (files.length === 0 && Object.keys(groups).length === 0) ? 0.5 : 1 }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</>
              : <><Download size={16} /> Unir archivos</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 6px 16px -4px rgba(34,197,94,0.5); } 50% { box-shadow: 0 6px 24px -2px rgba(34,197,94,0.8); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default UnirPDF;
