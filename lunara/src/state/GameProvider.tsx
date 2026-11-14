import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { ActionResult, BuildingId, GameState, MissionConfig, OperationsMode } from '@/types/game';
import * as engine from '@/game/gameEngine';
import { clearMission, loadMission, saveMission } from '@/services/storage';

interface GameContextValue {
  state: GameState | null;
  hydrated: boolean;
  saveError: string | null;
  startMission: (config: MissionConfig) => GameState;
  endDay: () => ActionResult | null;
  construct: (id: BuildingId) => ActionResult | null;
  repair: (id: BuildingId) => ActionResult | null;
  resolveEmergency: (instanceId: string, choiceId: string) => ActionResult | null;
  setMode: (mode: OperationsMode) => ActionResult | null;
  abort: () => ActionResult | null;
  discardMission: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

const SAVE_DELAY_MS = 250;

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore a saved mission on launch.
  useEffect(() => {
    let cancelled = false;
    loadMission()
      .then((saved) => {
        if (cancelled) return;
        stateRef.current = saved;
        setState(saved);
      })
      .catch(() => setSaveError('Saved progress could not be read.'))
      .finally(() => !cancelled && setHydrated(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const persistNow = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const current = stateRef.current;
    if (!current) return;
    try {
      await saveMission(current);
      setSaveError(null);
    } catch {
      setSaveError('Progress could not be saved to this device.');
    }
  }, []);

  // Save shortly after every change, and immediately when the app goes to the background.
  useEffect(() => {
    if (!hydrated || !state) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persistNow, SAVE_DELAY_MS);
  }, [state, hydrated, persistNow]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') void persistNow();
    });
    return () => sub.remove();
  }, [persistNow]);

  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const run = useCallback(
    (action: (s: GameState) => ActionResult): ActionResult | null => {
      const current = stateRef.current;
      if (!current) return null;
      const result = action(current);
      if (result.ok) commit(result.state);
      return result;
    },
    [commit],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      hydrated,
      saveError,
      startMission: (config) => {
        const next = engine.startMission(config);
        commit(next);
        return next;
      },
      endDay: () => run((s) => engine.endDay(s)),
      construct: (id) => run((s) => engine.constructBuilding(s, id)),
      repair: (id) => run((s) => engine.repairBuilding(s, id)),
      resolveEmergency: (instanceId, choiceId) => run((s) => engine.resolveEmergency(s, instanceId, choiceId)),
      setMode: (mode) => run((s) => engine.setOperationsMode(s, mode)),
      abort: () => run((s) => engine.abortMission(s)),
      discardMission: async () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        stateRef.current = null;
        setState(null);
        await clearMission();
      },
    }),
    [state, hydrated, saveError, run, commit],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}

/** For screens that only render while a mission exists (guarded by the mission layout). */
export function useMission(): GameState {
  const { state } = useGame();
  if (!state) throw new Error('No active mission');
  return state;
}
