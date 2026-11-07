import '@fontsource/andika/400.css';
import './styles.css';
import { albumPages } from './domain/album';
import { buildPool, countByStage } from './domain/pool';
import { emptyProgress, markAllSeen, recordOutcome, weightOf } from './domain/progress';
import { STAGES } from './domain/stageInfo';
import type { Stage } from './domain/types';
import { clearProgress, loadProgress, saveProgress } from './storage/progress';
import { loadSettings, saveSettings } from './storage/settings';
import { mountAlbumScreen } from './ui/albumScreen';
import { mountMenuScreen } from './ui/menuScreen';
import { mountParentScreen, practiceParts } from './ui/parentScreen';
import { mountReadingScreen } from './ui/readingScreen';

const app = document.getElementById('app');

if (app) {
  let unmount: () => void = () => {};
  let settings = loadSettings();
  let progress = loadProgress();
  const known = () => new Set(settings.known);

  const showMenu = (notice?: string): void => {
    unmount();
    unmount = mountMenuScreen(app, {
      known: known(),
      progress,
      name: settings.name,
      onPick: showReading,
      onOpenAlbum: showAlbum,
      onOpenParent: showParent,
      notice,
    });
  };

  const showReading = (stages: Stage[]): void => {
    unmount();
    unmount = mountReadingScreen(app, {
      pool: buildPool(known(), stages),
      name: settings.name,
      weight: (item) => weightOf(progress, item.id),
      onOutcome: (id, outcome) => {
        const result = recordOutcome(progress, id, outcome);
        progress = result.progress;
        saveProgress(progress);
        return result.learnedNow;
      },
      onOpenParent: showParent,
      onHome: () => showMenu(),
    });
  };

  const showAlbum = (): void => {
    unmount();
    unmount = mountAlbumScreen(app, {
      pages: albumPages(known(), progress),
      name: settings.name,
      onHome: () => {
        progress = markAllSeen(progress);
        saveProgress(progress);
        showMenu();
      },
    });
  };

  const showParent = (): void => {
    unmount();
    unmount = mountParentScreen(app, {
      settings,
      onDone: (next) => {
        settings = next;
        saveSettings(settings);
        const counts = countByStage(known());
        const parts = practiceParts(counts, STAGES.filter((s) => counts[s] > 0));
        showMenu(`Gespeichert: ${parts}`);
      },
      onCancel: () => showMenu(),
      onResetProgress: () => {
        clearProgress();
        progress = emptyProgress();
      },
    });
  };

  showMenu();
}
