export type Category =
  | 'people'
  | 'rail'
  | 'roads'
  | 'cricket'
  | 'space'
  | 'nature'
  | 'heritage'
  | 'culture'
  | 'food'
  | 'money'
  | 'civic'
  | 'cinema';

export interface Unit {
  /** Shown after the number: "km", "villages". Empty for pure currency. */
  label: string;
  /** Shown before the number, e.g. "₹". */
  prefix?: string;
}

export interface NapkinMath {
  /** One or two sentences on how to attack it. */
  lead: string;
  /** Worked rows: [step, value]. */
  steps: [string, string][];
  /** Where the napkin math lands. */
  estimate: number;
}

export interface Question {
  id: string;
  prompt: string;
  answer: number;
  unit: Unit;
  category: Category;
  emoji: string;
  /** Publisher of the figure, as plain text. */
  source: string;
  /** Year or period the answer refers to. */
  asOf: string;
  /** How settled the figure is. Medium/low must be re-checked before launch. */
  confidence: 'high' | 'medium' | 'low';
  /** Caveats shown under the answer. */
  note?: string;
  napkin: NapkinMath;
}
