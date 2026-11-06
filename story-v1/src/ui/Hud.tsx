import { useEffect, useRef } from 'react';
import { clock } from '../stage/clock';
import { frameHooks, nav, sceneOut, stats } from '../stage/bus';
import { actions, state } from '../stage/state';

// dev-only ?hud=1 readout: u (damped / scroll target / raw), fps, state.
export default function Hud() {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    let acc = 0;
    let frames = 0;
    let fps = 0;
    let worst = 0;
    const hook = (_u: number, dt: number) => {
      acc += dt;
      frames++;
      worst = Math.max(worst, dt);
      if (acc >= 0.5) {
        fps = frames / acc;
        const lines = [
          `u      ${clock.u.toFixed(3)}  v ${clock.v.toFixed(2)}`,
          `target ${clock.target.toFixed(3)}  raw ${nav.raw.toFixed(3)}`,
          `fps    ${fps.toFixed(0)}  worst ${(worst * 1000).toFixed(1)}ms  frames ${stats.frames}`,
          `night  ${sceneOut.night.toFixed(2)}${state.light.clicked ? ' (clicked)' : ''}  freeze ${sceneOut.freeze.toFixed(2)}`,
          `wx     ${state.weather.clicked ? `${state.weather.kind} (clicked)` : 'sequence'}`,
          `enc    ${state.encounters.clicked ? `set ${state.encounters.set} (clicked)` : 'sequence'}`,
          `action ${actions.cur ? `${actions.cur.kind} ${actions.cur.tau.toFixed(2)}` : '-'} q${actions.queue.length}`,
        ];
        if (ref.current) ref.current.textContent = lines.join('\n');
        acc = 0;
        frames = 0;
        worst = 0;
      }
    };
    frameHooks.push(hook);
    return () => {
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);
  return <pre id="hud" ref={ref} />;
}
