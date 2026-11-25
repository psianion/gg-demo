import { useRef } from 'react';
import { Link, NavLink, useLocation, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, CaretDown } from '@phosphor-icons/react';
import Sample from '../Sample';
import NotFound from './NotFound';
import { usePageMeta, useReveal } from '../meta';
import { Arrow, Mount, useMarker } from '../ui';
import { docGroups, docPages, docsIntro, placeholderBody } from '../content/docs';
import { BETA_STARTS } from '../content/home';

// /docs: the guide groups; /docs/:slug: one article. Both sit beside the tree, which is a sidebar on
// a wide window and a collapsible list on a phone.

// the marker on the tree's left edge slides to the current guide
function Tree() {
  const { pathname } = useLocation();
  const box = useRef<HTMLDivElement>(null);
  useMarker(box, 'a[aria-current="page"]', pathname);
  return (
    <div className="docs-tree-box" ref={box}>
      <span className="tree-marker" aria-hidden="true" />
      <ul className="docs-tree">
        {docGroups.map((g) => (
          <li key={g.id}>
            <p className="label">{g.title}</p>
            <ul>
              {g.pages.map((p) => (
                <li key={p.slug}>
                  <NavLink to={`/docs/${p.slug}`}>{p.title}</NavLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Landing() {
  usePageMeta('Guides', 'Good Goblin guides: install, host your first table, build maps with dynamic lighting, fog of war and multiple levels, run sessions and set up the Discord bot.');
  return (
    <>
      <header className="page-head">
        <h1>Guides</h1>
        {docGroups.length > 0 ? (
          <p className="lede">
            {docsIntro.text} <Sample on={docsIntro.sample} />
          </p>
        ) : (
          <p className="lede">The first guides arrive with the closed beta in {BETA_STARTS}.</p>
        )}
      </header>
      <ul className="docs-groups" data-reveal>
        {docGroups.map((g) => (
          <li key={g.id} id={g.id} className="docs-group" aria-labelledby={`dg-${g.id}`}>
            <Mount>
              <h2 id={`dg-${g.id}`}>{g.title}</h2>
              <p>
                {g.line} <Sample on={g.sample} />
              </p>
              <ul>
                {g.pages.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/docs/${p.slug}`}>
                      {p.title} <ArrowRight aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Mount>
          </li>
        ))}
      </ul>
    </>
  );
}

function Article({ slug }: { slug: string }) {
  const i = docPages.findIndex((p) => p.slug === slug);
  const page = docPages[i];
  const prev = docPages[i - 1];
  const next = docPages[i + 1];
  usePageMeta(page.title, page.summary);
  return (
    <article>
      <header className="page-head">
        <Link className="crumb" to={`/docs#${page.group.id}`}>
          <ArrowLeft aria-hidden="true" /> {page.group.title}
        </Link>
        <h1>{page.title}</h1>
        <p className="lede">{page.summary}</p>
      </header>
      <div className="prose">
        {placeholderBody.paragraphs.map((t, n) => (
          <p key={t}>
            {t}
            {n === placeholderBody.paragraphs.length - 1 && <Sample on={page.sample || placeholderBody.sample} />}
          </p>
        ))}
      </div>
      <nav className="docs-pager" aria-label="Previous and next guide">
        {prev && (
          <Link to={`/docs/${prev.slug}`} rel="prev">
            <Mount>
              <span>
                <ArrowLeft aria-hidden="true" /> Previous
              </span>
              {prev.title}
            </Mount>
          </Link>
        )}
        {next && (
          <Link to={`/docs/${next.slug}`} rel="next">
            <Mount>
              <span>
                Next <ArrowRight aria-hidden="true" />
              </span>
              {next.title}
            </Mount>
          </Link>
        )}
      </nav>
    </article>
  );
}

export default function Docs() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  useReveal();
  if (slug && !docPages.some((p) => p.slug === slug)) return <NotFound />;
  return (
    <div className="wrap grid page-inner docs">
      {docPages.length > 0 && (
        <>
          <nav className="docs-side" aria-label="Guides">
            <Tree />
          </nav>
          <div className="mount docs-fold-mount">
            <details className="mount-core docs-fold" key={pathname}>
              <summary>
                All guides <Arrow icon={<CaretDown />} />
              </summary>
              <nav aria-label="Guides">
                <Tree />
              </nav>
            </details>
          </div>
        </>
      )}
      <div className="docs-body">{slug ? <Article slug={slug} /> : <Landing />}</div>
    </div>
  );
}
