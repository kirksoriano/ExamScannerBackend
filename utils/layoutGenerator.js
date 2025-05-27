const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function generateAnswerSheetLayout(tos, questionCount = 20) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4: 595pt x 842pt
  const { width, height } = page.getSize();

  const margin = 40;
  const headerHeight = 80;
  const bubbleSize = 12;
  const bubbleSpacing = 24;
  const maxRowsPerCol = 10;
  const columnsNeeded = Math.ceil(questionCount / maxRowsPerCol);
  const topRowCols = Math.ceil(columnsNeeded / 2);
  const bottomRowCols = columnsNeeded - topRowCols;
  const colSpacing = (width - 2 * margin) / columnsNeeded;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ===== Draw corner detection squares (top-left, top-right, bottom-left, bottom-right of sheet layout)
  const markerSize = 20;
  const sheetTop = height - margin;
  const sheetBottom = margin;
  const sheetLeft = margin;
  const sheetRight = width - margin;

  // Draw marker squares
  const markers = [
    { x: sheetLeft, y: sheetTop - markerSize }, // top-left
    { x: sheetRight - markerSize, y: sheetTop - markerSize }, // top-right
    { x: sheetLeft, y: sheetBottom }, // bottom-left
    { x: sheetRight - markerSize, y: sheetBottom }, // bottom-right
  ];
  markers.forEach(({ x, y }) =>
    page.drawRectangle({ x, y, width: markerSize, height: markerSize, color: rgb(0, 0, 0) })
  );

  // ===== Draw black header box
  const headerX = sheetLeft + markerSize;
  const headerY = sheetTop - headerHeight - 10;
  const headerWidth = width - 2 * margin - 2 * markerSize;
  page.drawRectangle({
    x: headerX,
    y: headerY,
    width: headerWidth,
    height: headerHeight,
    color: rgb(0, 0, 0),
  });

  // ===== Draw header text and fields (white on black)
  const white = rgb(1, 1, 1);
  const lineY = (offset) => headerY + headerHeight - offset;

  // Title
  page.drawText('Answer Sheet', {
    x: headerX + 10,
    y: lineY(18),
    size: 14,
    font,
    color: white,
  });

  // Name line
  page.drawText('Name:', {
    x: headerX + 10,
    y: lineY(38),
    size: 10,
    font,
    color: white,
  });
  page.drawLine({
    start: { x: headerX + 50, y: lineY(36) },
    end: { x: headerX + headerWidth - 10, y: lineY(36) },
    thickness: 0.5,
    color: white,
  });

  // Class line
  page.drawText('Class:', {
    x: headerX + 10,
    y: lineY(53),
    size: 10,
    font,
    color: white,
  });
  page.drawLine({
    start: { x: headerX + 50, y: lineY(51) },
    end: { x: headerX + 200, y: lineY(51) },
    thickness: 0.5,
    color: white,
  });

  // Subject from TOS
  page.drawText(`Subject: ${tos.subject || 'N/A'}`, {
    x: headerX + headerWidth - 150,
    y: lineY(53),
    size: 10,
    font,
    color: white,
  });

  // ===== Draw question bubbles (top-row and bottom-row split)
  let qNum = 1;
  for (let i = 0; i < questionCount; i++) {
    let colIndex, rowIndex;

    if (i < topRowCols * maxRowsPerCol) {
      colIndex = Math.floor(i / maxRowsPerCol);
      rowIndex = i % maxRowsPerCol;
    } else {
      const adjustedIndex = i - topRowCols * maxRowsPerCol;
      colIndex = topRowCols + Math.floor(adjustedIndex / maxRowsPerCol);
      rowIndex = adjustedIndex % maxRowsPerCol;
    }

    const isTop = colIndex < topRowCols;
    const colX = margin + colIndex * colSpacing;
    const startY = isTop
      ? headerY - 30 - rowIndex * bubbleSpacing
      : headerY - 300 - rowIndex * bubbleSpacing;

    // Draw question number
    page.drawText(`Q${qNum}`, {
      x: colX,
      y: startY,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    // Draw A–D bubbles
    const choices = ['A', 'B', 'C', 'D'];
    choices.forEach((choice, j) => {
      const bubbleX = colX + 25 + j * 20;
      const bubbleY = startY - 2;

      page.drawCircle({
        x: bubbleX,
        y: bubbleY,
        size: bubbleSize / 2,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      page.drawText(choice, {
        x: bubbleX - 3,
        y: bubbleY + 8,
        size: 8,
        font,
        color: rgb(0, 0, 0),
      });
    });

    qNum++;
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}


// ✅ Proper exports
module.exports = {
  generateAnswerSheetLayout
};
