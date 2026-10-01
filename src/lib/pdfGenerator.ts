import type { FormSection } from './types';
import type { Submission } from './formSchema';
import farumaUrl from '../assets/Faruma.ttf';
const logoUrl = `${import.meta.env.BASE_URL}png.png`;

const FONT = "Faruma, 'Segoe UI', Tahoma, Arial, sans-serif";

async function ensureFarumaLoaded(): Promise<void> {
  if (document.fonts.check('13px Faruma')) return;
  const face = new FontFace('Faruma', `url(${farumaUrl})`);
  await face.load();
  document.fonts.add(face);
}
const GREEN = '#1a5f3f';
const GOLD = '#c8a951';
const TEXT = '#1a1a1a';
const MUTED = '#6b7280';
const BORDER = '#d1d5db';
const WHITE = '#ffffff';
const BG = '#f4f6f5';

const HAAZIRU_VI_SECTION_ID = 'a0b26d7d-345e-4d34-92a0-804cbace8bcd';

const isDhivehi = (text: string) => /[\u0780-\u07BF]/.test(text);

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // Preserve explicit newlines as separate lines, then word-wrap each paragraph
  const paragraphs = text.split('\n');
  const result: string[] = [];
  for (const para of paragraphs) {
    if (para.trim() === '') {
      result.push('');
      continue;
    }
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        if (current) result.push(current);
        current = word;
      }
    }
    if (current) result.push(current);
  }
  return result.length ? result : [''];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function drawSignatureBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  name: string,
  sigData: string | undefined
) {
  ctx.fillStyle = WHITE;
  ctx.fillRect(x, y, boxW - 4, boxH);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, boxW - 4, boxH);

  if (sigData) {
    try {
      const img = await loadImage(sigData);
      const maxW = boxW - 24;
      const maxH = boxH - 32;
      let iw = img.width;
      let ih = img.height;
      if (iw > maxW) { ih = Math.round(ih * maxW / iw); iw = maxW; }
      if (ih > maxH) { iw = Math.round(iw * maxH / ih); ih = maxH; }
      ctx.drawImage(img, x + (boxW - 4 - iw) / 2, y + 4, iw, ih);
    } catch (_) {}
  }

  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x + 8, y + boxH - 20);
  ctx.lineTo(x + boxW - 12, y + boxH - 20);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = TEXT;
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  const displayName = name || '—';
  const maxNameW = boxW - 16;
  let truncated = displayName;
  while (ctx.measureText(truncated).width > maxNameW && truncated.length > 1) {
    truncated = truncated.slice(0, -1);
  }
  ctx.fillText(truncated, x + (boxW - 4) / 2, y + boxH - 6);
}

export async function generateSubmissionImage(
  submission: Submission,
  sections: FormSection[]
): Promise<string> {
  await ensureFarumaLoaded();
  const SCALE = 3;
  const PAGE_W = 794;
  const MARGIN = 48;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const LINE_H = 22;
  const VALUE_W = CONTENT_W * 0.62;
  const SIG_BOX_H = 100;
  const COLS_PER_ROW = 4;

  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `13px ${FONT}`;

  const estimateHeight = (): number => {
    let h = 128 + 36;

    sections.forEach((sec) => {
      const regularFields = (sec.fields || []).filter((f) => f.field_type !== 'signature-select');
      const sigFields = (sec.fields || []).filter((f) => f.field_type === 'signature-select');

      if (regularFields.length > 0) {
        h += 36;
        regularFields.forEach((field) => {
          const val = String(submission.form_data[field.field_key] ?? '');
          const isTextarea = field.field_type === 'textarea';
          if (isTextarea) {
            const lines = wrapText(ctx, val || '-', CONTENT_W - 28);
            h += 28 + 10 + Math.max(LINE_H, lines.length * LINE_H) + 14 + 6;
          } else {
            const lines = wrapText(ctx, val || '-', VALUE_W - 16);
            h += Math.max(LINE_H, lines.length * LINE_H) + 8;
          }
        });
        h += 16;
      }

      if (sigFields.length > 0) {
        if (sec.id === HAAZIRU_VI_SECTION_ID) {
          const rawNames = submission.form_data[sigFields[0].field_key];
          const names: string[] = Array.isArray(rawNames) ? rawNames : (rawNames ? [String(rawNames)] : ['']);
          const numEntries = names.length;
          const numRows = Math.ceil(numEntries / COLS_PER_ROW);
          h += 36 + numRows * (SIG_BOX_H + 8) + 16;
        } else {
          h += 36 + SIG_BOX_H + 16;
        }
      }
    });

    h += 48;
    return h;
  };

  const logicalHeight = estimateHeight() + 60;
  canvas.width = PAGE_W * SCALE;
  canvas.height = logicalHeight * SCALE;
  ctx.scale(SCALE, SCALE);
  ctx.clearRect(0, 0, PAGE_W, logicalHeight);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, PAGE_W, logicalHeight);

  let y = 0;

  const LOGO_SIZE = 70;
  const HEADER_H = LOGO_SIZE + 58;
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, PAGE_W, HEADER_H);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, HEADER_H - 3, PAGE_W, 3);

  const LOGO_X = (PAGE_W - LOGO_SIZE) / 2;
  const LOGO_Y = 10;
  try {
    const logo = await loadImage(logoUrl);
    ctx.drawImage(logo, LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
  } catch (_) {}

  ctx.fillStyle = WHITE;
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ޔައުމިއްޔާ ރިޕޯޓް', PAGE_W / 2, LOGO_Y + LOGO_SIZE + 24);
  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Meeting Minutes Report', PAGE_W / 2, LOGO_Y + LOGO_SIZE + 44);
  y = HEADER_H;

  const submittedAt = new Date(submission.submitted_at);
  const submittedStr = `${submittedAt.toLocaleDateString('en-GB')} ${submittedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  ctx.fillStyle = MUTED;
  ctx.font = `11px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`ހުށަހެޅި: ${submittedStr}`, PAGE_W - MARGIN, y + 22);
  y += 36;

  ctx.textAlign = 'left';

  for (const sec of sections) {
    const regularFields = (sec.fields || []).filter((f) => f.field_type !== 'signature-select');
    const sigFields = (sec.fields || []).filter((f) => f.field_type === 'signature-select');

    if (regularFields.length > 0) {
      ctx.fillStyle = sec.style === 'signature' ? GOLD : GREEN;
      ctx.fillRect(MARGIN, y, CONTENT_W, 30);
      ctx.fillStyle = WHITE;
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(sec.label, PAGE_W - MARGIN - 12, y + 20);
      ctx.textAlign = 'left';
      y += 36;

      regularFields.forEach((field, fi) => {
        const val = String(submission.form_data[field.field_key] ?? '');
        const rtlVal = isDhivehi(val);
        ctx.font = `13px ${FONT}`;

        const isTextarea = field.field_type === 'textarea';

        if (isTextarea) {
          // Full-width layout: label header bar, then value lines with padding
          const LABEL_H = 28;
          const PADDING_TOP = 10;
          const PADDING_BOTTOM = 14;
          const valLines = wrapText(ctx, val || '-', CONTENT_W - 28);
          const contentH = Math.max(LINE_H, valLines.length * LINE_H);
          const rowH = LABEL_H + PADDING_TOP + contentH + PADDING_BOTTOM;

          // Row background
          ctx.fillStyle = fi % 2 === 0 ? WHITE : '#f9fafb';
          ctx.fillRect(MARGIN, y, CONTENT_W, rowH);
          ctx.strokeStyle = BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(MARGIN, y, CONTENT_W, rowH);

          // Label header band
          ctx.fillStyle = '#f0f4f2';
          ctx.fillRect(MARGIN, y, CONTENT_W, LABEL_H);
          ctx.strokeStyle = '#c3d9cc';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(MARGIN, y + LABEL_H);
          ctx.lineTo(MARGIN + CONTENT_W, y + LABEL_H);
          ctx.stroke();

          ctx.fillStyle = '#134a30';
          ctx.font = `bold 12px ${FONT}`;
          ctx.textAlign = 'right';
          ctx.direction = 'rtl';
          ctx.fillText(field.label, MARGIN + CONTENT_W - 12, y + LABEL_H - 8);

          // Value lines
          ctx.fillStyle = TEXT;
          ctx.font = `13px ${FONT}`;
          ctx.direction = rtlVal ? 'rtl' : 'ltr';
          ctx.textAlign = rtlVal ? 'right' : 'left';
          const valX = rtlVal ? MARGIN + CONTENT_W - 12 : MARGIN + 12;
          valLines.forEach((line, li) => {
            ctx.fillText(line, valX, y + LABEL_H + PADDING_TOP + LINE_H * li + 13);
          });
          ctx.direction = 'ltr';
          ctx.textAlign = 'left';

          y += rowH + 6;
        } else {
          // Two-column layout: value left, label right
          const valLines = wrapText(ctx, val || '-', VALUE_W - 16);
          const rowH = Math.max(LINE_H, valLines.length * LINE_H) + 8;

          ctx.fillStyle = fi % 2 === 0 ? WHITE : '#f9fafb';
          ctx.fillRect(MARGIN, y, CONTENT_W, rowH);
          ctx.strokeStyle = BORDER;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(MARGIN, y, CONTENT_W, rowH);

          ctx.fillStyle = MUTED;
          ctx.font = `bold 12px ${FONT}`;
          ctx.textAlign = 'right';
          ctx.direction = 'rtl';
          ctx.fillText(field.label, MARGIN + CONTENT_W - 8, y + 16);

          ctx.fillStyle = TEXT;
          ctx.font = `13px ${FONT}`;
          ctx.direction = rtlVal ? 'rtl' : 'ltr';
          ctx.textAlign = rtlVal ? 'right' : 'left';
          const valX = rtlVal ? MARGIN + VALUE_W - 8 : MARGIN + 8;
          valLines.forEach((line, li) => {
            ctx.fillText(line, valX, y + 16 + li * LINE_H);
          });
          ctx.direction = 'ltr';
          ctx.textAlign = 'left';

          y += rowH;
        }
      });

      y += 16;
    }

    if (sigFields.length > 0) {
      ctx.fillStyle = GOLD;
      ctx.fillRect(MARGIN, y, CONTENT_W, 30);
      ctx.fillStyle = WHITE;
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(sec.label, PAGE_W - MARGIN - 12, y + 20);
      ctx.textAlign = 'left';
      y += 36;

      if (sec.id === HAAZIRU_VI_SECTION_ID) {
        const field = sigFields[0];
        const rawNames = submission.form_data[field.field_key];
        const rawSigs = submission.signature_data[field.field_key];
        const names: string[] = Array.isArray(rawNames) ? rawNames as string[] : (rawNames ? [String(rawNames)] : ['']);
        const sigs: string[] = Array.isArray(rawSigs) ? rawSigs as string[] : (rawSigs ? [String(rawSigs)] : ['']);

        const numEntries = names.length;

        for (let rowStart = 0; rowStart < numEntries; rowStart += COLS_PER_ROW) {
          const rowEntries = names.slice(rowStart, rowStart + COLS_PER_ROW);
          const rowColCount = Math.min(rowEntries.length, COLS_PER_ROW);
          const rowBoxW = Math.floor(CONTENT_W / rowColCount);

          const drawTasks = rowEntries.map((name, ci) => {
            const x = MARGIN + ci * rowBoxW;
            const sigData = sigs[rowStart + ci];
            return drawSignatureBox(ctx, x, y, rowBoxW, SIG_BOX_H, name, sigData);
          });
          await Promise.all(drawTasks);
          y += SIG_BOX_H + 8;
        }
      } else {
        const field = sigFields[0];
        const name = String(submission.form_data[field.field_key] ?? '');
        const sigData = submission.signature_data[field.field_key] as string | undefined;
        const boxW = Math.floor(CONTENT_W / 3);
        await drawSignatureBox(ctx, MARGIN, y, boxW, SIG_BOX_H, name, sigData);
        y += SIG_BOX_H;
      }

      y += 16;
    }
  }

  ctx.fillStyle = GREEN;
  ctx.fillRect(0, logicalHeight - 32, PAGE_W, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ޔައުމިއްޔާ ސިސްޓަމް — Meeting Minutes System', PAGE_W / 2, logicalHeight - 12);

  return canvas.toDataURL('image/png');
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function downloadAsPdf(dataUrl: string, filename: string): Promise<void> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const imgW = img.width;
  const imgH = img.height;

  const cvs = document.createElement('canvas');
  cvs.width = imgW;
  cvs.height = imgH;
  const cx = cvs.getContext('2d')!;
  cx.fillStyle = '#ffffff';
  cx.fillRect(0, 0, imgW, imgH);
  cx.drawImage(img, 0, 0);
  const jpegUrl = cvs.toDataURL('image/jpeg', 0.95);

  const base64 = jpegUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const PT_W = (imgW / 3) * 0.75;
  const PT_H = (imgH / 3) * 0.75;

  const objects: string[] = [];
  const offsets: number[] = [];

  const addObj = (content: string): number => {
    const idx = objects.length + 1;
    objects.push(content);
    return idx;
  };

  const catalogIdx = addObj('');
  const pagesIdx = addObj('');
  const imgIdx = addObj('');
  const pageIdx = addObj('');

  objects[catalogIdx - 1] = `${catalogIdx} 0 obj\n<< /Type /Catalog /Pages ${pagesIdx} 0 R >>\nendobj`;
  objects[pagesIdx - 1] = `${pagesIdx} 0 obj\n<< /Type /Pages /Kids [${pageIdx} 0 R] /Count 1 >>\nendobj`;
  objects[imgIdx - 1] = `${imgIdx} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`;
  objects[pageIdx - 1] = `${pageIdx} 0 obj\n<< /Type /Page /Parent ${pagesIdx} 0 R /MediaBox [0 0 ${PT_W.toFixed(2)} ${PT_H.toFixed(2)}] /Resources << /XObject << /Img ${imgIdx} 0 R >> >> /Contents ${objects.length + 1} 0 R >>\nendobj`;

  const streamContent = `q ${PT_W.toFixed(2)} 0 0 ${PT_H.toFixed(2)} 0 0 cm /Img Do Q`;
  const contentsIdx = addObj(`${objects.length + 1} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  objects[pageIdx - 1] = `${pageIdx} 0 obj\n<< /Type /Page /Parent ${pagesIdx} 0 R /MediaBox [0 0 ${PT_W.toFixed(2)} ${PT_H.toFixed(2)}] /Resources << /XObject << /Img ${imgIdx} 0 R >> >> /Contents ${contentsIdx} 0 R >>\nendobj`;

  const encoder = new TextEncoder();
  const header = encoder.encode('%PDF-1.4\n');

  const parts: Uint8Array[] = [header];
  let offset = header.length;

  for (let i = 0; i < objects.length; i++) {
    offsets[i] = offset;
    if (i === imgIdx - 1) {
      const objHeader = encoder.encode(objects[i]);
      parts.push(objHeader);
      parts.push(bytes);
      const objFooter = encoder.encode('\nendstream\nendobj\n');
      parts.push(objFooter);
      offset += objHeader.length + bytes.length + objFooter.length;
    } else {
      const encoded = encoder.encode(objects[i] + '\n');
      parts.push(encoded);
      offset += encoded.length;
    }
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) {
    xref += o.toString().padStart(10, '0') + ' 00000 n \n';
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogIdx} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(encoder.encode(xref));

  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const pdfBytes = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of parts) { pdfBytes.set(p, pos); pos += p.length; }

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
