
export type Option = 'A' | 'B' | 'C' | 'D';

export interface BubbleCoordinate {
  cx: number;
  cy: number;
  radius: number; // Add this line to include the radius property
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
  // Left column: Q1–10
  { question: 1, options: { A: { cx: 140, cy: 315, radius: 20 }, B: { cx: 195, cy: 315, radius: 20 }, C: { cx: 250, cy: 315, radius: 20 }, D: { cx: 305, cy: 315, radius: 20 } } },
  { question: 2, options: { A: { cx: 140, cy: 390, radius: 20 }, B: { cx: 195, cy: 390, radius: 20 }, C: { cx: 250, cy: 390, radius: 20 }, D: { cx: 305, cy: 390, radius: 20 } } },
  { question: 3, options: { A: { cx: 140, cy: 465, radius: 20 }, B: { cx: 195, cy: 465, radius: 20 }, C: { cx: 250, cy: 465, radius: 20 }, D: { cx: 305, cy: 465, radius: 20 } } },
  { question: 4, options: { A: { cx: 140, cy: 540, radius: 20 }, B: { cx: 195, cy: 540, radius: 20 }, C: { cx: 250, cy: 540, radius: 20 }, D: { cx: 305, cy: 540, radius: 20 } } },
  { question: 5, options: { A: { cx: 140, cy: 615, radius: 20 }, B: { cx: 195, cy: 615, radius: 20 }, C: { cx: 250, cy: 615, radius: 20 }, D: { cx: 305, cy: 615, radius: 20 } } },
  { question: 6, options: { A: { cx: 140, cy: 690, radius: 20 }, B: { cx: 195, cy: 690, radius: 20 }, C: { cx: 250, cy: 690, radius: 20 }, D: { cx: 305, cy: 690, radius: 20 } } },
  { question: 7, options: { A: { cx: 140, cy: 765, radius: 20 }, B: { cx: 195, cy: 765, radius: 20 }, C: { cx: 250, cy: 765, radius: 20 }, D: { cx: 305, cy: 765, radius: 20 } } },
  { question: 8, options: { A: { cx: 140, cy: 840, radius: 20 }, B: { cx: 195, cy: 840, radius: 20 }, C: { cx: 250, cy: 840, radius: 20 }, D: { cx: 305, cy: 840, radius: 20 } } },
  { question: 9, options: { A: { cx: 140, cy: 915, radius: 20 }, B: { cx: 195, cy: 915, radius: 20 }, C: { cx: 250, cy: 915, radius: 20 }, D: { cx: 305, cy: 915, radius: 20 } } },
  { question: 10, options: { A: { cx: 140, cy: 990, radius: 20 }, B: { cx: 195, cy: 990, radius: 20 }, C: { cx: 250, cy: 990, radius: 20 }, D: { cx: 305, cy: 990, radius: 20 } } },


// Right column: Q11–20
{ question: 11, options: { A: { cx: 500, cy: 325, radius: 20 }, B: { cx: 560, cy: 325, radius: 20 }, C: { cx: 615, cy: 325, radius: 20 }, D: { cx: 670, cy: 325, radius: 20 } } },
{ question: 12, options: { A: { cx: 500, cy: 400, radius: 20 }, B: { cx: 560, cy: 400, radius: 20 }, C: { cx: 615, cy: 400, radius: 20 }, D: { cx: 670, cy: 400, radius: 20 } } },
{ question: 13, options: { A: { cx: 500, cy: 475, radius: 20 }, B: { cx: 560, cy: 475, radius: 20 }, C: { cx: 615, cy: 475, radius: 20 }, D: { cx: 670, cy: 475, radius: 20 } } },
{ question: 14, options: { A: { cx: 500, cy: 550, radius: 20 }, B: { cx: 560, cy: 550, radius: 20 }, C: { cx: 615, cy: 550, radius: 20 }, D: { cx: 670, cy: 550, radius: 20 } } },
{ question: 15, options: { A: { cx: 500, cy: 625, radius: 20 }, B: { cx: 560, cy: 625, radius: 20 }, C: { cx: 615, cy: 625, radius: 20 }, D: { cx: 670, cy: 625, radius: 20 } } },
{ question: 16, options: { A: { cx: 500, cy: 700, radius: 20 }, B: { cx: 560, cy: 700, radius: 20 }, C: { cx: 615, cy: 700, radius: 20 }, D: { cx: 670, cy: 700, radius: 20 } } },
{ question: 17, options: { A: { cx: 500, cy: 775, radius: 20 }, B: { cx: 560, cy: 775, radius: 20 }, C: { cx: 615, cy: 775, radius: 20 }, D: { cx: 670, cy: 775, radius: 20 } } },
{ question: 18, options: { A: { cx: 500, cy: 850, radius: 20 }, B: { cx: 560, cy: 850, radius: 20 }, C: { cx: 615, cy: 850, radius: 20 }, D: { cx: 670, cy: 850, radius: 20 } } },
{ question: 19, options: { A: { cx: 500, cy: 925, radius: 20 }, B: { cx: 560, cy: 925, radius: 20 }, C: { cx: 615, cy: 925, radius: 20 }, D: { cx: 670, cy: 925, radius: 20 } } },
{ question: 20, options: { A: { cx: 500, cy: 1000, radius: 20 }, B: { cx: 560, cy: 1000, radius: 20 }, C: { cx: 615, cy: 1000, radius: 20 }, D: { cx: 670, cy: 1000, radius: 20 } } },
];
