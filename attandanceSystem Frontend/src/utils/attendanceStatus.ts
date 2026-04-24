/**
 * Reads attendance status from backend records without treating 0 / false as "missing"
 * (Java/JSON often sends 0 or false for absent; `||` chains would incorrectly fall through to Present).
 */
export function pickRawAttendanceStatus(record: Record<string, unknown>): unknown {
  const keys = [
    'attendanceStatus',
    'attendance_status',
    // JPA entity field from your Java app
    'status',
    'attendance',
    'attendance_value',
    'p_a',
    'pa',
    'presentAbsent',
    'isPresent',
  ] as const;

  for (const key of keys) {
    const v = record[key as string];
    if (v !== undefined && v !== null && v !== '') {
      return v;
    }
  }
  return null;
}

export function statusToStorageString(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return 'Present';
  if (typeof raw === 'boolean') return raw ? 'Present' : 'Absent';
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw === 0) return '0';
    if (raw === 1) return '1';
  }
  return String(raw);
}

/** True when this day should count as absconded/absent (not present). */
export function isAbsentStatus(status: unknown): boolean {
  if (status === undefined || status === null || status === '') return false;
  if (typeof status === 'boolean') return !status;
  if (typeof status === 'number' && Number.isFinite(status)) {
    return status === 0;
  }
  const val = String(status).toLowerCase().trim();

  const explicitPresent =
    val === 'present' ||
    val === 'p' ||
    val === 'pr' ||
    val === 'yes' ||
    val === 'y' ||
    val === '1' ||
    val === 'true';

  if (explicitPresent) return false;

  const explicitAbsent =
    val === 'absent' ||
    val === 'a' ||
    val === 'ab' ||
    val === 'abs' ||
    val === '0' ||
    val === 'false' ||
    val === 'no' ||
    val === 'n';

  if (explicitAbsent) return true;
  if (val.includes('absent')) return true;
  if (val.includes('not present')) return true;

  return false;
}

/** Empty/missing rows default to present for backward compatibility with sparse APIs. */
export function isPresentStatus(status: unknown): boolean {
  if (status === undefined || status === null || status === '') return true;
  return !isAbsentStatus(status);
}
