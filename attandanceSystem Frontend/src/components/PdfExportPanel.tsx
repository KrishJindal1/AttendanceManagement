import React, { useState, useEffect, useCallback } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import '../styles/PdfExportPanel.css';

type PdfScope = 'all' | 'single_class';

const PdfExportPanel: React.FC = () => {
  const [scope, setScope] = useState<PdfScope>('all');
  const [className, setClassName] = useState('');
  const [knownClasses, setKnownClasses] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingType, setExportingType] = useState<'pdf' | 'excel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setError(null);
    try {
      const students = await apiService.getStudents();
      const unique = Array.from(new Set(students.map(s => s.className).filter(Boolean)));
      unique.sort((a, b) => a.localeCompare(b));
      setKnownClasses(unique);
    } catch {
      setKnownClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const handleExportPdf = async () => {
    if (scope === 'single_class' && !className.trim()) {
      setError('Choose or type a class name for a single-class export.');
      return;
    }
    setExporting(true);
    setExportingType('pdf');
    setError(null);
    try {
      await apiService.downloadAttendancePdf(
        scope,
        scope === 'single_class' ? className.trim() : undefined
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not generate PDF.');
    } finally {
      setExporting(false);
      setExportingType(null);
    }
  };

  const handleExportExcel = async () => {
    if (scope === 'single_class' && !className.trim()) {
      setError('Choose or type a class name for a single-class export.');
      return;
    }
    setExporting(true);
    setExportingType('excel');
    setError(null);
    try {
      await apiService.downloadAttendanceExcel(
        scope,
        scope === 'single_class' ? className.trim() : undefined
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not generate Excel.');
    } finally {
      setExporting(false);
      setExportingType(null);
    }
  };

  return (
    <div className="pdf-export-panel glass-panel animate-fade-in">
      <h3 className="pdf-export-title">Export to PDF / Excel</h3>
      <p className="pdf-export-desc">Download attendance tables (same summary as the dashboard).</p>

      <div className="pdf-export-options">
        <span className="pdf-export-label">Include</span>
        <label className="pdf-export-radio">
          <input
            type="radio"
            name="exportScope"
            checked={scope === 'all'}
            onChange={() => setScope('all')}
          />
          <span>
            <strong>All classes</strong>
            <span className="hint">One table per class.</span>
          </span>
        </label>
        <label className="pdf-export-radio">
          <input
            type="radio"
            name="exportScope"
            checked={scope === 'single_class'}
            onChange={() => setScope('single_class')}
          />
          <span>
            <strong>Single class</strong>
            <span className="hint">Only that class in the PDF.</span>
          </span>
        </label>
      </div>

      {scope === 'single_class' && (
        <div className="pdf-export-class">
          <label htmlFor="export-class-input">Class</label>
          <input
            id="export-class-input"
            type="text"
            className="pdf-export-class-input"
            list="export-known-classes"
            value={className}
            onChange={e => setClassName(e.target.value)}
            placeholder={loadingClasses ? 'Loading class list…' : 'e.g. CSE-1'}
          />
          <datalist id="export-known-classes">
            {knownClasses.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      )}

      {error && <div className="pdf-export-error">{error}</div>}

      <button
        type="button"
        className="btn-primary pdf-export-btn"
        onClick={handleExportPdf}
        disabled={exporting}
      >
        {exporting && exportingType === 'pdf' ? (
          <>
            <Loader2 className="spinner" size={18} />
            Building PDF…
          </>
        ) : (
          <>
            <FileDown size={18} />
            Download PDF
          </>
        )}
      </button>

      <button
        type="button"
        className="btn-primary pdf-export-btn"
        onClick={handleExportExcel}
        disabled={exporting}
      >
        {exporting && exportingType === 'excel' ? (
          <>
            <Loader2 className="spinner" size={18} />
            Building Excel…
          </>
        ) : (
          <>
            <FileDown size={18} />
            Download Excel
          </>
        )}
      </button>
    </div>
  );
};

export default PdfExportPanel;
