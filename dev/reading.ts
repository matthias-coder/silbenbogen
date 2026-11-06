import '@fontsource/andika/400.css';
import '../src/styles.css';
import { randomSyllables } from '../src/domain/pool';
import { makeWord } from '../src/domain/stage';
import { mountReadingScreen } from '../src/ui/readingScreen';

const known = new Set(['m', 'a', 'e', 'i', 'o', 'u', 'l', 's', 'n', 't', 'r']);
const words = ['Na-se', 'Ma-ma', 'Sa-lat', 'Ro-se'].map(makeWord);
mountReadingScreen(document.getElementById('app')!, {
  pool: [...randomSyllables(1, known), ...words],
  onOpenParent: () => console.log('open parent'),
});
