import '@fontsource/andika/400.css';
import './styles.css';
import { availableAreas, type Area } from './domain/areas';
import { buildPool, countByStage } from './domain/pool';
import { loadSettings, saveSettings } from './storage/settings';
import { mountMenuScreen } from './ui/menuScreen';
import { mountParentScreen, practiceParts } from './ui/parentScreen';
import { mountReadingScreen } from './ui/readingScreen';

const app = document.getElementById('app');

if (app) {
  let unmount: () => void = () => {};

  const showMenu = (notice?: string): void => {
    unmount();
    unmount = mountMenuScreen(app, {
      areas: availableAreas(loadSettings().stages),
      onPick: showReading,
      onOpenParent: showParent,
      notice,
    });
  };

  const showReading = (area: Area): void => {
    unmount();
    unmount = mountReadingScreen(app, {
      pool: buildPool({ ...loadSettings(), stages: area.stages }),
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
        const parts = practiceParts(countByStage(new Set(settings.known)), settings.stages);
        showMenu(`Gespeichert: ${parts}`);
      },
      onCancel: () => showMenu(),
    });
  };

  showMenu();
}
