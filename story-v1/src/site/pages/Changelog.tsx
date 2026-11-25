import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import Sample from '../Sample';
import NotFound from './NotFound';
import { usePageMeta, useReveal } from '../meta';
import { releases, type Release } from '../content/changelog';
import { BETA_STARTS } from '../content/home';

// /changelog: every release, newest first, each a row on the grid; /changelog/:version: one release's
// notes under the same header.

function Kind({ r }: { r: Release }) {
  return <span className={r.kind === 'Hotfix' ? 'kind hotfix' : 'kind'}>{r.kind}</span>;
}

function List() {
  usePageMeta('Changelog', 'Every Good Goblin release, newest first.');
  return (
    <div className="wrap page-inner">
      <header className="page-head">
        <h1>Changelog</h1>
        {releases.length === 0 && (
          <p className="lede">
            Good Goblin is on the{' '}
            <Link to="/roadmap" className="ul">
              road to 1.0
            </Link>
            . The first release, 0.1, ships with the closed beta in {BETA_STARTS}.
          </p>
        )}
      </header>
      <ol className="releases" data-reveal>
        {releases.map((r) => (
          <li key={r.version} className="grid release">
            <div className="release-when">
              <span className="ver tnum">{r.version}</span>
              <span className="date tnum">{r.date}</span>
              <Kind r={r} />
            </div>
            <div className="release-body">
              <h2>
                {r.summary} <Sample on={r.sample} />
              </h2>
              <Link to={`/changelog/${r.version}`} className="link-arrow">
                <span>Read the notes</span> <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Notes({ r }: { r: Release }) {
  usePageMeta(r.version, r.summary);
  return (
    <article className="wrap page-inner">
      <header className="page-head">
        <Link className="crumb" to="/changelog">
          <ArrowLeft aria-hidden="true" /> Changelog
        </Link>
        <h1 className="tnum">{r.version}</h1>
        <p className="release-meta">
          <Kind r={r} />
          <span className="date tnum">{r.date}</span>
          <Sample on={r.sample} />
        </p>
        <p className="lede">{r.summary}</p>
      </header>
      <div className="prose">
        {r.notes.map((n) => (
          <section key={n.heading}>
            <h2>{n.heading}</h2>
            <ul>
              {n.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}

export default function Changelog() {
  const { version } = useParams();
  useReveal();
  if (!version) return <List />;
  const r = releases.find((x) => x.version === version);
  return r ? <Notes r={r} /> : <NotFound />;
}
