// Intentionally no attendance-status helpers here; /api/attendance/students already returns computed summaries.

/**
 * Prefer same-origin `/api/...` so `vite dev` / `vite preview` proxies work (see vite.config.ts).
 * For static hosting without a reverse proxy, set `VITE_API_BASE_URL` at build time (e.g. http://localhost:8080/api/attendance).
 */
function resolveApiRoot(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    let base = fromEnv.trim().replace(/\/$/, '');
    // If they provided the specific attendance URL, strip it to get the root
    if (base.endsWith('/attendance')) {
      base = base.substring(0, base.length - '/attendance'.length);
    } else if (base.endsWith('/auth')) {
      base = base.substring(0, base.length - '/auth'.length);
    }
    return base;
  }
  return '/api';
}

const API_ROOT = resolveApiRoot();
const ATTENDANCE_URL = `${API_ROOT}/attendance`;
const AUTH_URL = `${API_ROOT}/auth`;


function networkErrorHint(): string {
  return import.meta.env.VITE_API_BASE_URL
    ? 'Check VITE_API_BASE_URL and that the server is reachable from the browser.'
    : 'Run the Java API on port 8080 and use `npm run dev` or `vite preview` (Vite proxies /api → :8080). For other hosts, build with VITE_API_BASE_URL set.';
}

function isLikelyNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('load failed') ||
    m.includes('network request failed')
  );
}

function wrapNetworkError(err: unknown): Error {
  if (isLikelyNetworkFailure(err)) {
    return new Error(`Could not reach the attendance API. ${networkErrorHint()}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

export interface Student {
  id?: string;
  name: string;
  className: string;
  rollNumber: string;

  // Daily record mapping
  attendanceRecords: Record<string, string>; // e.g., { "2024-03-28": "Present" }

  // Calculated Analytics
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
  /** Set in UI when aggregating rows (absent count as % of total days). */
  absentPercentage?: number;
}

export interface UploadHistory {
  id: string;
  fileName: string;
  uploadDate: string | number[];
  status: string;
}

/**
 * Safely parses dates that could come back as an Array [YYYY, MM, DD, HH, MM, SS] from Java Spring Boot
 * or as standard ISO strings.
 */
export const parseUploadDate = (dateValue: unknown): Date => {
  if (!dateValue) return new Date(0);
  if (Array.isArray(dateValue)) {
    // Java returns [year, month, day, hour, minute, second] where month is 1-indexed
    return new Date(
      dateValue[0] || 0,
      (dateValue[1] || 1) - 1,
      dateValue[2] || 1,
      dateValue[3] || 0,
      dateValue[4] || 0,
      dateValue[5] || 0
    );
  }
  const parsed = new Date(dateValue as string | number);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

export const apiService = {
  /**
   * Upload an Excel file
   * @param file The Excel file to upload
   */
  uploadExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Explicitly send the current date on which the file is uploaded
    formData.append('date', new Date().toISOString().split('T')[0]);

    try {
      const response = await fetch(`${ATTENDANCE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Try to parse the backend error message
        const errorText = await response.text();
        let errorMessage = `Upload failed (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // The backend might return plain text (e.g., "File uploaded successfully") instead of JSON
      const responseText = await response.text();
      try {
        return JSON.parse(responseText);
      } catch {
        return { message: responseText };
      }
    } catch (err: unknown) {
      throw wrapNetworkError(err);
    }
  },

  /**
   * Download attendance report as PDF (tables per class). Triggers a file download in the browser.
   */
  downloadAttendancePdf: async (scope: 'all' | 'single_class', className?: string) => {
    const params = new URLSearchParams({ scope });
    if (scope === 'single_class' && className) {
      params.set('className', className);
    }

    const pdfUrl = `${ATTENDANCE_URL}/export/pdf?${params.toString()}`;
    let response: Response;
    try {
      // `cache: 'no-store'` avoids stale/empty cached responses; SW also skips API via workbox NetworkOnly
      response = await fetch(pdfUrl, { cache: 'no-store' });
    } catch (err: unknown) {
      throw wrapNetworkError(err);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `PDF export failed (${response.status})`);
    }

    let blob: Blob;
    try {
      const buffer = await response.arrayBuffer();
      const mime =
        response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/pdf';
      blob = new Blob([buffer], { type: mime });
    } catch (err: unknown) {
      throw new Error(
        `The PDF download started but the browser could not read the file data. ${networkErrorHint()} Original: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  /**
   * Download attendance report as Excel (.xlsx) with summary tables.
   */
  downloadAttendanceExcel: async (
    scope: 'all' | 'single_class',
    className?: string
  ) => {
    const params = new URLSearchParams({ scope });
    if (scope === 'single_class' && className) {
      params.set('className', className);
    }

    const excelUrl = `${ATTENDANCE_URL}/export/excel?${params.toString()}`;
    let response: Response;
    try {
      response = await fetch(excelUrl, { cache: 'no-store' });
    } catch (err: unknown) {
      throw wrapNetworkError(err);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Excel export failed (${response.status})`);
    }

    let blob: Blob;
    try {
      const buffer = await response.arrayBuffer();
      const mime =
        response.headers.get('content-type')?.split(';')[0]?.trim() ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      blob = new Blob([buffer], { type: mime });
    } catch (err: unknown) {
      throw new Error(
        `The Excel download started but the browser could not read the file data. ${networkErrorHint()} Original: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  /**
   * Fetch student attendance summaries.
   * If selectedDate is provided (YYYY-MM-DD), totals are calculated up to that date (inclusive)
   * and daily status is included only for that selected date.
   */
  getStudents: async (selectedDate?: string | null): Promise<Student[]> => {
    const params = new URLSearchParams();
    if (selectedDate) {
      params.set('selectedDate', selectedDate);
    }

    const url = params.toString()
      ? `${ATTENDANCE_URL}/students?${params.toString()}`
      : `${ATTENDANCE_URL}/students`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch (err: unknown) {
      throw wrapNetworkError(err);
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch students: ${response.statusText}`);
    }
    const data = await response.json();
    return data as Student[];
  },

  /**
   * Fetch upload history
   */
  getHistory: async (): Promise<UploadHistory[]> => {
    let response: Response;
    try {
      response = await fetch(`${ATTENDANCE_URL}/history`);
    } catch (err: unknown) {
      throw wrapNetworkError(err);
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map((item: Record<string, unknown>) => ({
      ...item,
      uploadDate: item.uploadDate || item.uploadedAt || item.createdAt || item.timestamp || item.uploadTime || new Date().toISOString()
    }));
  },

  /**
   * Helper to construct a download URL for a file by its ID
   */
  getFileDownloadUrl: (id: string) => {
    return `${ATTENDANCE_URL}/download/${id}`;
  },

  /**
   * Login endpoint
   */
  login: async (credentials: Record<string, unknown>) => {
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      return data;
    } catch (err: unknown) {
      throw wrapNetworkError(err);
    }
  },

  /**
   * Fetch a single student's attendance summary
   */
  getStudentById: async (id: string): Promise<Student> => {
    try {
      const response = await fetch(`${ATTENDANCE_URL}/students/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch student: ${response.statusText}`);
      }
      const data = await response.json();
      return data as Student;
    } catch (err: unknown) {
      throw wrapNetworkError(err);
    }
  }
};
