
export type Option = 'A' | 'B' | 'C' | 'D';

export interface BubbleCoordinate {
  cx: number;
  cy: number;
}

export interface BubbleTemplate {
  question: number;
  options: {
    A: BubbleCoordinate;
    B: BubbleCoordinate;
    C: BubbleCoordinate;
    D: BubbleCoordinate;
  };
}

// Fixed coordinates for a 20-question sheet (2-column layout)
// Left column: Q1–10, Right column: Q11–20

export const bubbles: BubbleTemplate[] = [
  // Left column (Questions 1–10)
  { question: 1, options: { A: { cx: 289.74, cy: 500.36 }, B: { cx: 376.74, cy: 500.36 }, C: { cx: 465.94, cy: 500.36 }, D: { cx: 552.54, cy: 500.36 } } },
  { question: 2, options: { A: { cx: 289.74, cy: 615.56 }, B: { cx: 376.74, cy: 615.56 }, C: { cx: 465.94, cy: 615.56 }, D: { cx: 552.54, cy: 615.56 } } },
  { question: 3, options: { A: { cx: 289.74, cy: 733.76 }, B: { cx: 376.74, cy: 733.76 }, C: { cx: 465.94, cy: 733.76 }, D: { cx: 552.54, cy: 733.76 } } },
  { question: 4, options: { A: { cx: 289.74, cy: 846.96 }, B: { cx: 376.74, cy: 846.96 }, C: { cx: 465.94, cy: 846.96 }, D: { cx: 552.54, cy: 846.96 } } },
  { question: 5, options: { A: { cx: 289.74, cy: 966.16 }, B: { cx: 376.74, cy: 966.16 }, C: { cx: 465.94, cy: 966.16 }, D: { cx: 552.54, cy: 966.16 } } },
  { question: 6, options: { A: { cx: 289.74, cy: 1079.36 }, B: { cx: 376.74, cy: 1079.36 }, C: { cx: 465.94, cy: 1079.36 }, D: { cx: 552.54, cy: 1079.36 } } },
  { question: 7, options: { A: { cx: 289.74, cy: 1196.56 }, B: { cx: 376.74, cy: 1196.56 }, C: { cx: 465.94, cy: 1196.56 }, D: { cx: 552.54, cy: 1196.56 } } },
  { question: 8, options: { A: { cx: 289.74, cy: 1310.76 }, B: { cx: 376.74, cy: 1310.76 }, C: { cx: 465.94, cy: 1310.76 }, D: { cx: 552.54, cy: 1310.76 } } },
  { question: 9, options: { A: { cx: 289.74, cy: 1425.96 }, B: { cx: 376.74, cy: 1425.96 }, C: { cx: 465.94, cy: 1425.96 }, D: { cx: 552.54, cy: 1425.96 } } },
  { question: 10, options: { A: { cx: 289.74, cy: 1540.16 }, B: { cx: 376.74, cy: 1540.16 }, C: { cx: 465.94, cy: 1540.16 }, D: { cx: 552.54, cy: 1540.16 } } },

  // Right column (Questions 11–20)
  { question: 11, options: { A: { cx: 1086.32, cy: 500.36 }, B: { cx: 1172.32, cy: 500.36 }, C: { cx: 1259.32, cy: 500.36 }, D: { cx: 1342.32, cy: 500.36 } } },
  { question: 12, options: { A: { cx: 1086.32, cy: 615.56 }, B: { cx: 1172.32, cy: 615.56 }, C: { cx: 1259.32, cy: 615.56 }, D: { cx: 1342.32, cy: 615.56 } } },
  { question: 13, options: { A: { cx: 1086.32, cy: 733.76 }, B: { cx: 1172.32, cy: 733.76 }, C: { cx: 1259.32, cy: 733.76 }, D: { cx: 1342.32, cy: 733.76 } } },
  { question: 14, options: { A: { cx: 1086.32, cy: 846.96 }, B: { cx: 1172.32, cy: 846.96 }, C: { cx: 1259.32, cy: 846.96 }, D: { cx: 1342.32, cy: 846.96 } } },
  { question: 15, options: { A: { cx: 1086.32, cy: 966.16 }, B: { cx: 1172.32, cy: 966.16 }, C: { cx: 1259.32, cy: 966.16 }, D: { cx: 1342.32, cy: 966.16 } } },
  { question: 16, options: { A: { cx: 1086.32, cy: 1079.36 }, B: { cx: 1172.32, cy: 1079.36 }, C: { cx: 1259.32, cy: 1079.36 }, D: { cx: 1342.32, cy: 1079.36 } } },
  { question: 17, options: { A: { cx: 1086.32, cy: 1196.56 }, B: { cx: 1172.32, cy: 1196.56 }, C: { cx: 1259.32, cy: 1196.56 }, D: { cx: 1342.32, cy: 1196.56 } } },
  { question: 18, options: { A: { cx: 1086.32, cy: 1310.76 }, B: { cx: 1172.32, cy: 1310.76 }, C: { cx: 1259.32, cy: 1310.76 }, D: { cx: 1342.32, cy: 1310.76 } } },
  { question: 19, options: { A: { cx: 1086.32, cy: 1425.96 }, B: { cx: 1172.32, cy: 1425.96 }, C: { cx: 1259.32, cy: 1425.96 }, D: { cx: 1342.32, cy: 1425.96 } } },
  { question: 20, options: { A: { cx: 1086.32, cy: 1540.16 }, B: { cx: 1172.32, cy: 1540.16 }, C: { cx: 1259.32, cy: 1540.16 }, D: { cx: 1342.32, cy: 1540.16 } } },
];