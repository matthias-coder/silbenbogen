import '@fontsource/andika/400.css';
import './styles.css';
import { buildPool, countByStage } from './domain/pool';
import { loadSettings, saveSettings } from './storage/settings';
import { mountParentScreen, practiceParts } from './ui/parentScreen';
import { mountReadingScreen } from './ui/readingScreen';

const app = document.getElementById('app');

if (app) {
  let unmount: () => void = () => {};

  const showReading = (notice?: string): void => {
    unmount();
    unmount = mountReadingScreen(app, {
      pool: buildPool(loadSettings()),
      onOpenParent: showParent,
      notice,
    });
  };

  const showParent = (): void => {
    unmount();
    unmount = mountParentScreen(app, {
      settings: loadSettings(),
      onDone: (settings) => {
        saveSettings(settings);
        const parts = practiceParts(countByStage(new Set(settings.known)), settings.stages);
        showReading(`Gespeichert: ${parts}`);
      },
      onCancel: () => showReading(),
    });
  };

  showReading();
}
