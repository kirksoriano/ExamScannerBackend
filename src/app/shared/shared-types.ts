// Define BubbleTemplate
interface BubbleTemplate {
    // Define the structure of BubbleTemplate
    options: { [key: string]: { cx: number, cy: number, radius: number } };
}

// Define Option as a type
type Option = 'A' | 'B' | 'C' | 'D';