// The visitor's choices. Scroll never writes here; a click does, and from then on that
// toggle follows this store instead of the scroll sequence ("a clicked state stays").
//
// A click becomes an ACTION: a real-time clip the goblin performs (tau 0→1 over `dur`
// seconds). The state values the action changes are pure functions of tau, written by
// the actor each frame, so a clip can never leave a value half-set.

export type Chip = 'light' | 'weather' | 'encounters';
export type Weather = 'clear' | 'rain' | 'snow';
export type ActionKind = 'lightOn' | 'lightOff' | 'rain' | 'snow' | 'clear' | 'monsters' | 'swap';

export const DUR: Record<ActionKind, number> = {
  lightOn: 1.2,
  lightOff: 0.8,
  rain: 1.2,
  snow: 1.15,
  clear: 0.9,
  monsters: 1.2,
  swap: 1.0,
};

export const state = {
  light: { clicked: false, night: 0 },
  weather: { clicked: false, kind: 'clear' as Weather, cloud: 0, rain: 0, snow: 0, squash: 0, lastWet: 'clear' as Weather },
  encounters: { clicked: false, show: 0, set: 0, swap: 0 },
};

export interface Running {
  kind: ActionKind;
  tau: number;
  // values captured at start, so the clip blends out of whatever was on screen
  from: { night: number; cloud: number; rain: number; snow: number; show: number; swap: number };
  ax: number; // goblin anchor at start (island coords)
  az: number;
}

export const actions = {
  queue: [] as ActionKind[],
  cur: null as Running | null,
  /** chip the cursor is over — the goblin glances at it */
  hover: null as Chip | null,
};

// what each chip will be once the queue drains — clicks decide off this, so a fast
// double click toggles twice instead of repeating the same action
const predicted = { night: -1, weather: '' as Weather | '', shown: -1 };

export interface Effective {
  night: number;
  weather: Weather;
  shown: boolean;
}

export function click(chip: Chip, eff: Effective): void {
  if (actions.queue.length >= 2) return; // queue, never stack
  const night = predicted.night >= 0 ? predicted.night > 0.5 : eff.night > 0.5;
  const weather = (predicted.weather || eff.weather) as Weather;
  const shown = predicted.shown >= 0 ? predicted.shown > 0 : eff.shown;
  let kind: ActionKind;
  if (chip === 'light') {
    kind = night ? 'lightOff' : 'lightOn';
    predicted.night = night ? 0 : 1;
  } else if (chip === 'weather') {
    // clear → rain → (shoo) clear → snow → clear → rain …
    if (weather !== 'clear') state.weather.lastWet = weather;
    if (weather === 'clear') kind = state.weather.lastWet === 'rain' ? 'snow' : 'rain';
    else kind = 'clear';
    const next: Weather = kind === 'clear' ? 'clear' : kind === 'rain' ? 'rain' : 'snow';
    if (next !== 'clear') state.weather.lastWet = next;
    predicted.weather = next;
  } else {
    kind = shown ? 'swap' : 'monsters';
    predicted.shown = 1;
  }
  actions.queue.push(kind);
}

export function queueDrained(): void {
  predicted.night = -1;
  predicted.weather = '';
  predicted.shown = -1;
}

// the light choice is the site's dark mode, so it persists
try {
  const saved = localStorage.getItem('gg.light');
  if (saved === 'night' || saved === 'day') {
    state.light.clicked = true;
    state.light.night = saved === 'night' ? 1 : 0;
  }
} catch {
  /* storage blocked — default sequence */
}

export function persistLight(night: boolean): void {
  try {
    localStorage.setItem('gg.light', night ? 'night' : 'day');
  } catch {
    /* fine */
  }
}
