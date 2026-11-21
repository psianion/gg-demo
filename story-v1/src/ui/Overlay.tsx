import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { frameHooks, live, nav, sceneOut } from '../stage/bus';
import { clock } from '../stage/clock';
import { lerp, seg, settle, smooth, window01 } from '../stage/ease';
import { actions, click, type Chip } from '../stage/state';
import { Glyph } from './Glyph';
import WaitlistCard from './WaitlistCard';
import './overlay.css';

// The DOM over the canvas. Everything here is shown, hidden and moved by u in ONE
// frame hook that runs inside the canvas loop, so type and picture can't disagree.

interface Cap { a: number; b: number; text: string; small?: boolean }
const CAPTIONS: Cap[] = [
  { a: 0.9, b: 2.05, text: 'Every world needs a stagehand.' }, // whole by 1.2, as the goblin hauls
  { a: 2.3, b: 4.0, text: 'You decide. He does.' },
  { a: 8.3, b: 10.1, text: 'Your players sit down. The table’s already set.' },
  { a: 12.35, b: 12.98, text: 'You’re welcome.', small: true },
  { a: 13.5, b: 15.05, text: 'Runs on the DM’s machine. Nothing for players to install.' },
  { a: 15.1, b: 16.15, text: 'They never see me. That’s the job.' },
];

const CHIPS: { id: Chip; label: string; seg: [number, number] }[] = [
  { id: 'light', label: 'Light', seg: [2, 4] },
  { id: 'weather', label: 'Weather', seg: [4, 6] },
  { id: 'encounters', label: 'Encounters', seg: [6, 8] },
];

const DAY = new THREE.Color(0xf7f5f0);
const NIGHT = new THREE.Color(0x3c4255);
const INK_DAY = new THREE.Color(0x222222);
const INK_NIGHT = new THREE.Color(0xeee8da);
const QUIET_DAY = new THREE.Color(0x4a4844);
const QUIET_NIGHT = new THREE.Color(0xc9c3b6);
const tmp = new THREE.Color();

export default function Overlay() {
  const root = useRef<HTMLDivElement>(null);
  const [wx, setWx] = useState<'clear' | 'rain' | 'snow'>('clear');
  const [used, setUsed] = useState<Record<Chip, boolean>>({ light: false, weather: false, encounters: false });

  useEffect(() => {
    const el = root.current!;
    const q = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
    const caps = [...el.querySelectorAll<HTMLElement>('.caption')];
    const rail = q('.rail');
    const chips = [...el.querySelectorAll<HTMLElement>('.chip')];
    const pill = q('.turn-pill');
    const pillTexts = [...pill.querySelectorAll<HTMLElement>('span')];
    const wait = q('.wait-chip');
    const chrome = q('.product');
    const chromeParts = [...chrome.querySelectorAll<HTMLElement>('[data-from]')];
    const dim = q('.product-dim');
    const card = q('.card');
    const peek = q('.peek-glyph');
    let lastNight = -1;
    let lastWx = '';
    let last = -1;

    const hook = (u: number) => {
      // site colours follow the light toggle (dark mode), blended, every surface at once
      const n = sceneOut.night;
      if (Math.abs(n - lastNight) > 1e-3) {
        lastNight = n;
        const r = document.documentElement.style;
        r.setProperty('--paper', `#${tmp.copy(DAY).lerp(NIGHT, n * 0.85).getHexString()}`);
        r.setProperty('--line', `#${tmp.copy(INK_DAY).lerp(INK_NIGHT, n).getHexString()}`);
        r.setProperty('--quiet', `#${tmp.copy(QUIET_DAY).lerp(QUIET_NIGHT, n).getHexString()}`);
        document.documentElement.classList.toggle('night', n > 0.5);
      }
      const eff = live.effective?.(u);
      if (eff && eff.weather !== lastWx) {
        lastWx = eff.weather;
        setWx(eff.weather);
      }
      if (Math.abs(u - last) < 1e-5) return;
      last = u;

      CAPTIONS.forEach((c, i) => {
        const o = window01(u, c.a, c.b, 0.14);
        const draw = smooth(seg(u, c.a, c.a + 0.3));
        caps[i].style.opacity = String(o);
        caps[i].style.visibility = o > 0.001 ? 'visible' : 'hidden';
        caps[i].style.clipPath = `inset(-20% ${(1 - draw) * 100}% -20% 0)`;
        caps[i].style.transform = `translate(-50%, ${lerp(8, 0, smooth(seg(u, c.a, c.a + 0.25)))}px)`;
      });

      const ro = window01(u, 1.85, 8.2, 0.2);
      rail.style.opacity = String(ro);
      rail.style.visibility = ro > 0.001 ? 'visible' : 'hidden';
      rail.style.setProperty('--slide', `${(1 - smooth(seg(u, 1.85, 2.1))) * 24 - smooth(seg(u, 7.95, 8.2)) * 24}px`);
      chips.forEach((c, i) => {
        const [a, b] = CHIPS[i].seg;
        c.classList.toggle('current', u >= a && u < b);
        const on = !eff ? false : i === 0 ? eff.night > 0.5 : i === 1 ? eff.weather !== 'clear' : eff.shown;
        c.classList.toggle('on', on);
      });

      const po = window01(u, 8.55, 12.98, 0.15);
      pill.style.opacity = String(po);
      pill.style.visibility = po > 0.001 ? 'visible' : 'hidden';
      const t0 = 1 - smooth(seg(u, 11.56, 11.66));
      const t2 = smooth(seg(u, 12.24, 12.34));
      const t1 = (1 - t0) * (1 - t2);
      pillTexts[0].style.opacity = String(t0);
      pillTexts[1].style.opacity = String(t1);
      pillTexts[2].style.opacity = String(t2);
      pill.classList.toggle('crit', t2 > 0.5);

      const wo = window01(u, 0.35, 16.95, 0.25);
      wait.style.opacity = String(wo);
      wait.style.visibility = wo > 0.001 ? 'visible' : 'hidden';

      // Beat 5: the island becomes the product canvas — chrome draws in, then dims
      const ci = seg(u, 16.85, 17.25);
      chrome.style.visibility = ci > 0 ? 'visible' : 'hidden';
      chromeParts.forEach((p, i) => {
        const k = settle(seg(ci, i * 0.08, 0.6 + i * 0.08));
        const from = p.dataset.from!;
        const d = (1 - k) * 100;
        p.style.transform = from === 'top' ? `translateY(${-d}%)` : from === 'left' ? `translateX(${-d}%)` : from === 'right' ? `translateX(${d}%)` : `translateY(${d}%)`;
        p.style.opacity = String(smooth(clamp01(k * 2)));
      });
      const dm = smooth(seg(u, 17.25, 17.7));
      dim.style.opacity = String(dm * 0.62);
      dim.style.visibility = dm > 0 ? 'visible' : 'hidden';
      const ck = seg(u, 17.3, 17.85);
      card.style.visibility = ck > 0 ? 'visible' : 'hidden';
      card.style.opacity = String(smooth(clamp01(ck * 2.2)));
      card.style.transform = `translate(-50%, calc(-50% + ${(1 - settle(ck)) * 46}px)) rotate(${(1 - settle(ck)) * -1.6}deg)`;
      // the third and last look: ears and eyes over the card's bottom edge
      const pk = settle(seg(u, 17.62, 17.98));
      peek.style.transform = `translate(-50%, ${lerp(105, 18, pk)}%)`;
    };
    frameHooks.push(hook);
    return () => {
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);

  const press = (id: Chip) => {
    const eff = live.effective?.(clock.u);
    if (!eff) return;
    click(id, eff);
    setUsed((u) => ({ ...u, [id]: true }));
  };

  return (
    <div id="overlay" ref={root}>
      {CAPTIONS.map((c) => (
        <p key={c.text} className={`caption${c.small ? ' small' : ''}`}>
          {c.text}
        </p>
      ))}

      <nav className="rail" aria-label="Try the canvas">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip${used[c.id] ? ' used' : ''}`}
            onClick={() => press(c.id)}
            onPointerEnter={() => (actions.hover = c.id)}
            onPointerLeave={() => (actions.hover = null)}
            onFocus={() => (actions.hover = c.id)}
            onBlur={() => (actions.hover = null)}
          >
            <span className="chip-ring">
              <Glyph name={c.id === 'weather' ? `weather-${wx}` : c.id} />
            </span>
            <span className="chip-label">{c.label}</span>
            <svg className="chip-tick" viewBox="0 0 14 12" aria-hidden="true">
              <path d="M1.5 6.5 L5 10 L12.5 1.5" />
            </svg>
          </button>
        ))}
      </nav>

      <div className="turn-pill" aria-live="polite">
        <span>&#9656; Rook&rsquo;s turn</span>
        <span>Rook rolled&hellip; a 1</span>
        <span>Critical hit!</span>
      </div>

      <button type="button" className="wait-chip" onClick={() => nav.go(17.9, { duration: 2.6 })}>
        Join the waitlist
      </button>

      <div className="product" aria-hidden="true">
        <div className="pc-top" data-from="top">
          <b>Good Goblin</b>
          <span className="pc-tabs"><i className="on">Map</i><i>Table</i><i>Bot</i></span>
          <span className="pc-session">Session 12 &middot; The Sunken Road</span>
          <span className="pc-live">&#9679; live</span>
        </div>
        <div className="pc-left" data-from="left">
          {['Select', 'Paint', 'Props', 'Fog', 'Tokens', 'Light'].map((t) => (
            <i key={t}>{t}</i>
          ))}
        </div>
        <div className="pc-right" data-from="right">
          <h4>Initiative</h4>
          {['Rook 18', 'Dire wolf 15', 'Mira 14', 'Bram 11', 'Skeleton 9', 'Tess 6'].map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
        <div className="pc-bottom" data-from="bottom">
          <span>Discord &middot; 4 players connected</span>
          <span>Layer: Ground</span>
        </div>
      </div>
      <div className="product-dim" />

      <WaitlistCard peek />
    </div>
  );
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
