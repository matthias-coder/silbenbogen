import '@fontsource/andika/400.css';
import './styles.css';
import { buildPool } from './domain/pool';
import { loadSettings, saveSettings } from './storage/settings';
import { mountParentScreen } from './ui/parentScreen';
import { mountReadingScreen } from './ui/readingScreen';

const app = document.getElementById('app');

if (app) {
  let unmount: () => void = () => {};

  const showReading = (): void => {
    unmount();
    unmount = mountReadingScreen(app, {
      pool: buildPool(loadSettings()),
      onOpenParent: showParent,
    });
  };

  const showParent = (): void => {
    unmount();
    unmount = mountParentScreen(app, {
      settings: loadSettings(),
      onDone: (settings) => {
        saveSettings(settings);
        showReading();
      },
    });
  };

  showReading();
}
