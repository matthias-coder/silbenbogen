import '@fontsource/andika/400.css';
import '../src/styles.css';
import { makeWord } from '../src/domain/stage';
import { createItemView } from '../src/ui/itemView';

const w = new URLSearchParams(location.search).get('w') ?? 'Na-se';
const view = createItemView(makeWord(w), () => console.log('complete'));
document.getElementById('host')!.appendChild(view.el);
document.getElementById('reset')!.addEventListener('click', () => view.reset());
