import '@fontsource/andika/400.css';
import './styles.css';
import { emptyProgress } from './domain/progress';
import { buildPool, countByStage } from './domain/pool';
import { loadSettings, saveSettings } from './storage/settings';
import { mountMenuScreen } from './ui/menuScreen';
import { mountParentScreen, practiceParts } from './ui/parentScreen';
import { mountReadingScreen } from './ui/readingScreen';
import type { Stage } from './domain/types';

const app = document.getElementById('app');

if (app) {
  let unmount: () => void = () => {};
  const availableStages = (): Stage[] => {
    const counts = countByStage(new Set(loadSettings().known));
    return ([1, 2, 3, 4, 5, 6] as Stage[]).filter((s) => counts[s] > 0);
  };

  const showMenu = (notice?: string): void => {
    unmount();
    const settings = loadSettings();
    unmount = mountMenuScreen(app, {
      known: new Set(settings.known),
      progress: emptyProgress(),
      name: settings.name,
      onPick: showReading,
      onOpenAlbum: () => {},
      onOpenParent: showParent,
      notice,
    });
  };

  const showReading = (stages: Stage[]): void => {
    unmount();
    unmount = mountReadingScreen(app, {
      pool: buildPool(new Set(loadSettings().known), stages),
      onOpenParent: showParent,
      onHome: () => showMenu(),
    });
  };

  const showParent = (): void => {
    unmount();
    unmount = mountParentScreen(app, {
      settings: loadSettings(),
      onDone: (settings) => {
        saveSettings(settings);
        const parts = practiceParts(countByStage(new Set(settings.known)), availableStages());
        showMenu(`Gespeichert: ${parts}`);
      },
      onCancel: () => showMenu(),
    });
  };

  showMenu();
}
