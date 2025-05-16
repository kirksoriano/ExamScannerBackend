
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
  { question: 1, options: { A: { cx: 200, cy: 325, radius: 30 }, B: { cx: 250, cy: 325, radius: 30 }, C: { cx: 300, cy: 325, radius: 30 }, D: { cx: 350, cy: 325, radius: 30 } } },
  { question: 2, options: { A: { cx: 200, cy: 400, radius: 30 }, B: { cx: 250, cy: 400, radius: 30 }, C: { cx: 300, cy: 400, radius: 30 }, D: { cx: 350, cy: 400, radius: 30 } } },
  { question: 3, options: { A: { cx: 200, cy: 475, radius: 30 }, B: { cx: 250, cy: 475, radius: 30 }, C: { cx: 300, cy: 475, radius: 30 }, D: { cx: 350, cy: 475, radius: 30 } } },
  { question: 4, options: { A: { cx: 200, cy: 550, radius: 30 }, B: { cx: 250, cy: 550, radius: 30 }, C: { cx: 300, cy: 550, radius: 30 }, D: { cx: 350, cy: 550, radius: 30 } } },
  { question: 5, options: { A: { cx: 200, cy: 625, radius: 30 }, B: { cx: 250, cy: 625, radius: 30 }, C: { cx: 300, cy: 625, radius: 30 }, D: { cx: 350, cy: 625, radius: 30 } } },
  { question: 6, options: { A: { cx: 200, cy: 700, radius: 30 }, B: { cx: 250, cy: 700, radius: 30 }, C: { cx: 300, cy: 700, radius: 30 }, D: { cx: 350, cy: 700, radius: 30 } } },
  { question: 7, options: { A: { cx: 200, cy: 775, radius: 30 }, B: { cx: 250, cy: 775, radius: 30 }, C: { cx: 300, cy: 775, radius: 30 }, D: { cx: 350, cy: 775, radius: 30 } } },
  { question: 8, options: { A: { cx: 200, cy: 850, radius: 30 }, B: { cx: 250, cy: 850, radius: 30 }, C: { cx: 300, cy: 850, radius: 30 }, D: { cx: 350, cy: 850, radius: 30 } } },
  { question: 9, options: { A: { cx: 200, cy: 925, radius: 30 }, B: { cx: 250, cy: 925, radius: 30 }, C: { cx: 300, cy: 925, radius: 30 }, D: { cx: 350, cy: 925, radius: 30 } } },
  { question: 10, options: { A: { cx: 200, cy: 1000, radius: 30 }, B: { cx: 250, cy: 1000, radius: 30 }, C: { cx: 300, cy: 1000, radius: 30 }, D: { cx: 350, cy: 1000, radius: 30 } } },

  // Right column: Q11–20
{ question: 11, options: { A: { cx: 500, cy: 325, radius: 30 }, B: { cx: 550, cy: 325, radius: 30 }, C: { cx: 600, cy: 325, radius: 30 }, D: { cx: 650, cy: 325, radius: 30 } } },
{ question: 12, options: { A: { cx: 500, cy: 400, radius: 30 }, B: { cx: 550, cy: 400, radius: 30 }, C: { cx: 600, cy: 400, radius: 30 }, D: { cx: 650, cy: 400, radius: 30 } } },
{ question: 13, options: { A: { cx: 500, cy: 475, radius: 30 }, B: { cx: 550, cy: 475, radius: 30 }, C: { cx: 600, cy: 475, radius: 30 }, D: { cx: 650, cy: 475, radius: 30 } } },
{ question: 14, options: { A: { cx: 500, cy: 550, radius: 30 }, B: { cx: 550, cy: 550, radius: 30 }, C: { cx: 600, cy: 550, radius: 30 }, D: { cx: 650, cy: 550, radius: 30 } } },
{ question: 15, options: { A: { cx: 500, cy: 625, radius: 30 }, B: { cx: 550, cy: 625, radius: 30 }, C: { cx: 600, cy: 625, radius: 30 }, D: { cx: 650, cy: 625, radius: 30 } } },
{ question: 16, options: { A: { cx: 500, cy: 700, radius: 30 }, B: { cx: 550, cy: 700, radius: 30 }, C: { cx: 600, cy: 700, radius: 30 }, D: { cx: 650, cy: 700, radius: 30 } } },
{ question: 17, options: { A: { cx: 500, cy: 775, radius: 30 }, B: { cx: 550, cy: 775, radius: 30 }, C: { cx: 600, cy: 775, radius: 30 }, D: { cx: 650, cy: 775, radius: 30 } } },
{ question: 18, options: { A: { cx: 500, cy: 850, radius: 30 }, B: { cx: 550, cy: 850, radius: 30 }, C: { cx: 600, cy: 850, radius: 30 }, D: { cx: 650, cy: 850, radius: 30 } } },
{ question: 19, options: { A: { cx: 500, cy: 925, radius: 30 }, B: { cx: 550, cy: 925, radius: 30 }, C: { cx: 600, cy: 925, radius: 30 }, D: { cx: 650, cy: 925, radius: 30 } } },
{ question: 20, options: { A: { cx: 500, cy: 1000, radius: 30 }, B: { cx: 550, cy: 1000, radius: 30 }, C: { cx: 600, cy: 1000, radius: 30 }, D: { cx: 650, cy: 1000, radius: 30 } } },
];

