/**
 * Export Actions
 * --------------------------------------------------------------------------
 * The "last mile" for lib/reportExport: takes the generated Markdown / CSV
 * strings and actually gets them off the device - via file download or the
 * native Web Share sheet (great on mobile / PWA). Browser-only, but every fn
 * guards `typeof window` so importing it in SSR / a worker won't crash.
 */

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Trigger a file download from an in-memory string. Returns false if not in a
 * browser (caller can decide on a fallback).
 */
export function downloadText(
  filename: string,
  content: string,
  mime = 'text/plain;charset=utf-8',
): boolean {
  if (!isBrowser()) return false;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

export function downloadMarkdown(stem: string, markdown: string): boolean {
  return downloadText(`${stem}.md`, markdown, 'text/markdown;charset=utf-8');
}

export function downloadCsv(stem: string, csv: string): boolean {
  // Prepend a UTF-8 BOM so Excel opens it with correct encoding.
  return downloadText(`${stem}.csv`, '\uFEFF' + csv, 'text/csv;charset=utf-8');
}

/** True if the native share sheet is available (mobile / installed PWA). */
export function canShare(): boolean {
  return isBrowser() && typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Share a report via the native share sheet. Prefers sharing as a file (so the
 * recipient gets a real .md/.txt), falling back to sharing plain text, then to
 * a download. Returns the strategy used, or 'failed'.
 */
export async function shareReport(
  title: string,
  text: string,
  filename = 'ibs-report.md',
): Promise<'file' | 'text' | 'download' | 'failed'> {
  if (!isBrowser()) return 'failed';

  // 1) Try sharing as a file (best UX where supported).
  try {
    const nav = navigator as Navigator & {
      canShare?: (data?: { files?: File[] }) => boolean;
    };
    if (nav.share && typeof File !== 'undefined') {
      const file = new File([text], filename, { type: 'text/markdown' });
      if (!nav.canShare || nav.canShare({ files: [file] })) {
        await nav.share({ title, text, files: [file] } as ShareData);
        return 'file';
      }
    }
  } catch (e) {
    // user-cancelled or unsupported -> fall through
    if ((e as DOMException)?.name === 'AbortError') return 'failed';
  }

  // 2) Try sharing plain text.
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return 'text';
    }
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return 'failed';
  }

  // 3) Last resort: download the file.
  return downloadText(filename, text, 'text/markdown;charset=utf-8') ? 'download' : 'failed';
}

/** Copy text to the clipboard. Returns false on failure / no clipboard API. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
