import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react';
import Sample from '../Sample';
import { usePageMeta, useReveal } from '../meta';
import { reducedMotion } from '../ui';
import { requests, roadItems, roadmapIntro, type Stage } from '../content/roadmap';

// /roadmap: the road to 1.0, no dates, in planned order. Tabs filter by stage on the page. The tabs'
// thumb slides to the chosen tab, and on every filter the rows glide from where they were to where they
// now are (FLIP); new rows fade in.

const TABS: { id: 'all' | Stage; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'now', label: 'Now' },
  { id: 'next', label: 'Next' },
  { id: 'later', label: 'Later' },
  { id: 'shipped', label: 'Shipped' },
];
const STAGE_LABEL = Object.fromEntries(TABS.map((t) => [t.id, t.label])) as Record<Stage, string>;
const STAGE_ORDER: Stage[] = ['now', 'next', 'later', 'shipped'];
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'; // site.css --ease

// rows glide to their new places: where each row was is kept after every layout, and the next layout
// plays each one from there to its new place, by transform only
function useFlip(list: RefObject<HTMLUListElement | null>, key: string) {
  const was = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const ul = list.current;
    if (!ul) return;
    const rows = [...ul.querySelectorAll<HTMLElement>('[data-id]')];
    const now = new Map(rows.map((r) => [r.dataset.id!, r.offsetTop]));
    if (!reducedMotion() && was.current.size) {
      rows.forEach((r, i) => {
        const from = was.current.get(r.dataset.id!);
        if (from === undefined) {
          r.animate(
            [
              { opacity: 0, transform: 'translateY(16px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 560, delay: 60 + i * 30, easing: EASE, fill: 'backwards' },
          );
        } else if (from !== now.get(r.dataset.id!)) {
          r.animate([{ transform: `translateY(${from - now.get(r.dataset.id!)!}px)` }, { transform: 'none' }], {
            duration: 620,
            easing: EASE,
          });
        }
      });
    }
    was.current = now;
  }, [list, key]);
}

export default function Roadmap() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const list = useRef<HTMLUListElement>(null);
  usePageMeta('Road to 1.0', 'The Good Goblin roadmap to 1.0: what is being built now, next and later. Request features on Discord.');
  useReveal();
  useFlip(list, tab);

  // arrow keys, Home and End move between the tabs
  const key = (e: KeyboardEvent, i: number) => {
    const n = TABS.length;
    const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    setTab(TABS[to].id);
    tabs.current[to]?.focus();
  };

  const items = roadItems
    .filter((r) => tab === 'all' || r.stage === tab)
    .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.plan - b.plan);
  const at = TABS.findIndex((t) => t.id === tab);

  return (
    <div className="wrap page-inner">
      <header className="page-head">
        <h1>Road to 1.0</h1>
        <p className="lede">
          {roadmapIntro.text} <Sample on={roadmapIntro.sample} />
        </p>
        <p className="road-note">
          {requests.text}{' '}
          <a href={requests.link.href} className="ul">
            {requests.link.label}
          </a>
          <Sample on={requests.link.sample} />
        </p>
      </header>

      <div className="grid">
        <div className="road-main" data-reveal>
          <div className="road-controls">
            <div
              role="tablist"
              aria-label="Stage"
              className="road-tabs"
              style={{ '--at': at, '--n': TABS.length } as CSSProperties}
            >
              <span className="road-thumb" aria-hidden="true" />
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls="road-panel"
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => key(e, i)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div role="tabpanel" id="road-panel" className="road-panel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
            <ul className="road-list" ref={list}>
              {items.map((r) => (
                <li key={r.id} data-id={r.id} className="road-item">
                  <div>
                    <h2>
                      {r.title} <Sample on={r.sample} />
                    </h2>
                    <p>{r.line}</p>
                  </div>
                  <div className="road-side">
                    <span className={`kind ${r.stage}`}>{STAGE_LABEL[r.stage]}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
