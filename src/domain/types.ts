export type Grapheme = string; // as written: "Sch", "u", "ll"
export type Syllable = Grapheme[];
export type Stage = 1 | 2 | 3 | 4 | 5 | 6;
export interface Item {
  id: string;
  kind: 'silbe' | 'wort';
  text: string;
  syllables: Syllable[];
  stage: Stage;
  keys: string[];
}
export interface Settings {
  version: 1;
  known: string[];
  stages: Stage[];
}
