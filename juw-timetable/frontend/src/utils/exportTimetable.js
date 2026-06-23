// frontend/src/utils/exportTimetable.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = [
  { id:1, label:'9:00 - 10:00'  },
  { id:2, label:'10:00 - 11:00' },
  { id:3, label:'11:00 - 12:00' },
  { id:4, label:'12:00 - 1:00'  },
  { id:5, label:'1:00 - 2:00'   },
];

// Navy  = #2d4a5a  →  rgb(45,  74,  90)
// Teal  = #3a6070  →  rgb(58,  96, 112)
// Light blue cell bg  rgb(232,244,253)
// Light teal  cell bg rgb(230,248,244)

// ── Build grid ────────────────────────────────────────────────────────────
function buildGrid(entries) {
  const grid = {};
  DAYS.forEach(d => {
    grid[d] = {};
    SLOTS.forEach(s => { grid[d][s.id] = null; });
  });
  entries.forEach(e => {
    const day  = e.day?.trim();
    const slot = parseInt(e.time_slot);
    if (grid[day] !== undefined && slot >= 1 && slot <= 5) {
      // Only store in the starting slot
      if (!grid[day][slot]) grid[day][slot] = e;
    }
  });
  return grid;
}

// ── PDF Export ────────────────────────────────────────────────────────────
export function exportTimetablePDF(entries, options = {}) {
  const { title = 'Timetable', subtitle = '', filename } = options;

  const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Page header band ──
  doc.setFillColor(45, 74, 90);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 10);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 230);
    doc.text(subtitle, 14, 17);
  }
  const dateStr = `Generated: ${new Date().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}`;
  doc.setFontSize(8);
  doc.setTextColor(180, 210, 220);
  doc.text(dateStr, pageW - 14, 17, { align: 'right' });

  // ── Build table body with colSpan for labs ──
  const grid = buildGrid(entries);

  // autoTable doesn't support colSpan natively in body cells,
  // so we build the grid manually using jsPDF drawing primitives.
  // We'll use autoTable for the header row only, then draw rows manually.

  const marginL  = 10;
  const marginR  = 10;
  const tableW   = pageW - marginL - marginR;
  const dayColW  = 22;
  const slotColW = (tableW - dayColW) / 5;   // 5 time slots
  const rowH     = 28;                         // height per day row
  const headerH  = 10;
  const startY   = 26;

  // ── Draw header row ──
  const headerCols = ['Day / Time', ...SLOTS.map(s => s.label)];
  const colWidths  = [dayColW, slotColW, slotColW, slotColW, slotColW, slotColW];

  doc.setFillColor(45, 74, 90);
  doc.rect(marginL, startY, tableW, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  let xCursor = marginL;
  headerCols.forEach((col, i) => {
    const cw = colWidths[i];
    doc.text(col, xCursor + cw / 2, startY + 6.5, { align: 'center' });
    xCursor += cw;
  });

  // ── Draw data rows ──
  const dataStartY = startY + headerH;
  doc.setFont('helvetica', 'normal');

  DAYS.forEach((day, rowIdx) => {
    const y        = dataStartY + rowIdx * rowH;
    const isShaded = rowIdx % 2 === 1;

    // Row background
    doc.setFillColor(isShaded ? 250 : 255, isShaded ? 252 : 255, isShaded ? 254 : 255);
    doc.rect(marginL, y, tableW, rowH, 'F');

    // Day label column background
    doc.setFillColor(245, 248, 250);
    doc.rect(marginL, y, dayColW, rowH, 'F');

    // Row border
    doc.setDrawColor(210, 220, 228);
    doc.setLineWidth(0.3);
    doc.rect(marginL, y, tableW, rowH, 'S');

    // Day label text
    doc.setTextColor(45, 74, 90);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(day, marginL + dayColW / 2, y + rowH / 2 + 1, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    // Draw slot columns — handle lab colSpan
    let slotIdx = 1;
    let xPos    = marginL + dayColW;

    while (slotIdx <= 5) {
      const entry = grid[day][slotIdx];

      if (entry && entry.is_lab) {
        // Lab: spans 3 columns
        const cellW = slotColW * 3;

        // Teal background
        doc.setFillColor(58, 96, 112);
        doc.rect(xPos, y, cellW, rowH, 'F');

        // Border
        doc.setDrawColor(210, 220, 228);
        doc.rect(xPos, y, cellW, rowH, 'S');

        // Cell text
        const lines = [
          entry.short_name || entry.subject_name,
          entry.teacher_name?.split(' ').slice(0, 3).join(' ') || '',
          entry.room_code || entry.room_id || '',
          entry.batch_name || '',
          '[Lab — 3 hrs]',
        ].filter(Boolean);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        lines.forEach((line, li) => {
          if (li === 0) doc.setFont('helvetica', 'bold');
          else doc.setFont('helvetica', 'normal');
          doc.text(line, xPos + 3, y + 4.5 + li * 4.5, { maxWidth: cellW - 5 });
        });

        // Draw column dividers inside lab cell (visual)
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.2);
        doc.line(xPos + slotColW,     y, xPos + slotColW,     y + rowH);
        doc.line(xPos + slotColW * 2, y, xPos + slotColW * 2, y + rowH);
        doc.setDrawColor(210, 220, 228);
        doc.setLineWidth(0.3);

        xPos   += cellW;
        slotIdx += 3;
      } else if (entry) {
        // Regular 1-hour class
        const cellW = slotColW;

        doc.setFillColor(232, 244, 253);
        doc.rect(xPos, y, cellW, rowH, 'F');
        doc.setDrawColor(210, 220, 228);
        doc.rect(xPos, y, cellW, rowH, 'S');

        const lines = [
          entry.short_name || entry.subject_name,
          entry.teacher_name?.split(' ').slice(0, 3).join(' ') || '',
          entry.room_code || entry.room_id || '',
          entry.batch_name || '',
        ].filter(Boolean);

        doc.setTextColor(26, 46, 58);
        doc.setFontSize(7);
        lines.forEach((line, li) => {
          if (li === 0) doc.setFont('helvetica', 'bold');
          else doc.setFont('helvetica', 'normal');
          doc.text(line, xPos + 2, y + 4.5 + li * 4.5, { maxWidth: cellW - 3 });
        });

        xPos   += cellW;
        slotIdx += 1;
      } else {
        // Empty cell
        doc.setDrawColor(210, 220, 228);
        doc.rect(xPos, y, slotColW, rowH, 'S');
        xPos   += slotColW;
        slotIdx += 1;
      }
    }
  });

  // ── Legend ──
  const legendY = dataStartY + DAYS.length * rowH + 6;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  doc.setFillColor(232, 244, 253);
  doc.rect(marginL, legendY, 8, 4, 'F');
  doc.setDrawColor(180, 210, 220); doc.rect(marginL, legendY, 8, 4, 'S');
  doc.setTextColor(90, 112, 128);
  doc.text('Regular class (1 hr)', marginL + 10, legendY + 3);

  doc.setFillColor(58, 96, 112);
  doc.rect(marginL + 50, legendY, 8, 4, 'F');
  doc.text('Lab (3 hrs)', marginL + 60, legendY + 3);

  doc.setTextColor(90, 112, 128);
  doc.text(`Total classes: ${entries.length}`, pageW - marginR, legendY + 3, { align: 'right' });

  // ── Page 2: Class list ──
  if (entries.length > 0) {
    doc.addPage();

    doc.setFillColor(45, 74, 90);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${title} — Class List`, 14, 12);

    const sorted = entries.slice().sort((a, b) => {
      const di = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      return di !== 0 ? di : a.time_slot - b.time_slot;
    });

    autoTable(doc, {
      head: [['#', 'Day', 'Time', 'Subject', 'Teacher', 'Room', 'Batch', 'Type']],
      body: sorted.map((e, i) => [
        i + 1,
        e.day,
        e.slot_label || `Slot ${e.time_slot}`,
        e.subject_name,
        e.teacher_name || '—',
        e.room_code || e.room_id || '—',
        e.batch_name || '—',
        e.is_lab ? 'Lab (3h)' : 'Regular',
      ]),
      startY: 22,
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [26, 46, 58] },
      headStyles: { fillColor: [45, 74, 90], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 252, 254] },
      didParseCell(data) {
        if (data.section === 'body') {
          const row = sorted[data.row.index];
          if (row?.is_lab) {
            data.cell.styles.fillColor = [230, 248, 244];
            data.cell.styles.textColor = [22, 96, 80];
          }
        }
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        7: { halign: 'center' },
      },
      margin: { left: 10, right: 10 },
    });
  }

  const outFile = filename || `${title.replace(/[^a-z0-9]/gi, '_')}_Timetable.pdf`;
  doc.save(outFile);
}