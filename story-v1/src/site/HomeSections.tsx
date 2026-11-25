import { Link } from 'react-router';
import {
  ArrowRight,
  DiceFive,
  GitBranch,
  HardDrives,
  Heartbeat,
  Lightbulb,
  ListNumbers,
  MapPin,
  NotePencil,
  Play,
  Ruler,
  Scroll,
  SpeakerHigh,
  type Icon,
} from '@phosphor-icons/react';
import Sample from './Sample';
import JoinInline from './JoinInline';
import { Arrow, Mount } from './ui';
import { useReveal } from './meta';
import {
  BETA_STARTS,
  closingPicture,
  features,
  products,
  smallFeatures,
  steps,
  why,
  type Picture,
  type SmallFeature,
} from './content/home';
import { groupHref, guideHref, hasGuide } from './content/docs';

// The homepage below the hero, each section its own layout: why (an editorial statement over a short
// staggered run), the products (a bento of mounted frames), at the table (demo slots in a 2:1 then 1:2
// rhythm), the smaller things (the page's one marquee), start here (numbered pills on a switchback
// route) and the close (the date set large, the campfire, the waitlist field). Words: content/home.ts.

const SMALL_ICON: Record<SmallFeature['icon'], Icon> = {
  dice: DiceFive,
  initiative: ListNumbers,
  ruler: Ruler,
  handout: Scroll,
  condition: Heartbeat,
  pin: MapPin,
  notes: NotePencil,
  sound: SpeakerHigh,
};
// why: each point's glyph, and the picture set into the statement beside it
const WHY_ICON: Icon[] = [Lightbulb, HardDrives, GitBranch];

function Img({ p, eager = false }: { p: Picture; eager?: boolean }) {
  return (
    <img src={p.src} width={p.width} height={p.height} alt={p.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  );
}

export default function HomeSections() {
  useReveal();
  const [big, ...small] = products;

  return (
    <div className="home-sections">
      {/* why: the three points as one statement, pictures set into the line, then what each means */}
      <section className="wrap hs hs-why" aria-labelledby="hs-why">
        <div data-reveal>
          <h2 id="hs-why" className="hs-kicker">
            Why Good Goblin
          </h2>
          <p className="why-line">
            {why.map((w, i) => {
              // the picture stays on the line of the point's last word
              const words = w.title.split(' ');
              const last = words.pop();
              return (
                <span key={w.title}>
                  {words.length > 0 && `${words.join(' ')} `}
                  <span className="why-end">
                    {last}.
                    <span className="why-pic" style={{ backgroundImage: `url(${products[i].picture.src})` }} aria-hidden="true" />
                  </span>{' '}
                </span>
              );
            })}
          </p>
        </div>
        <ul className="why-run" data-reveal>
          {why.map((w, i) => {
            const G = WHY_ICON[i];
            return (
              <li key={w.title}>
                <span className="why-ic" aria-hidden="true">
                  <G size={22} />
                </span>
                <p>
                  <span className="sr-only">{w.title}: </span>
                  {w.line}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* the three products: a bento of mounted frames, the map editor large, the other two stacked */}
      <section className="wrap hs" id="products" aria-labelledby="hs-products">
        <div data-reveal>
          <h2 id="hs-products" className="hs-title">
            Three tools, one game night
          </h2>
        </div>
        <ul className="hs-products" data-reveal>
          {[big, ...small].map((p, i) => (
            <li key={p.id} id={p.id} className={i === 0 ? 'hs-product big' : 'hs-product'}>
              <Link to={groupHref(p.docs)} className="hs-product-link">
                <Mount className="hs-product-frame">
                  <Img p={p.picture} />
                </Mount>
                <div className="cap">
                  <div>
                    <h3>{p.title}</h3>
                    <p>
                      {p.line} <Sample on={p.sample} />
                    </p>
                  </div>
                  <span className="cap-go">
                    <span className="sr-only">{p.title} guides</span>
                    <Arrow />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* at the table: four demo slots, 2:1 then 1:2, their rows lined up across each pair */}
      <section className="wrap hs" aria-labelledby="hs-features">
        <div data-reveal>
          <h2 id="hs-features" className="hs-title">
            Pro-level tools, free for every table
          </h2>
        </div>
        <ul className="hs-features" data-reveal>
          {features.map((f, i) => (
            <li key={f.title} className={`hs-feature t${i}`}>
              <Mount className="demo">
                <div className="demo-in" role="img" aria-label={`Demo video to come: ${f.title}`}>
                  <span className="play-pill" aria-hidden="true">
                    <span className="btn-ic">
                      <Play weight="fill" />
                    </span>
                    Demo video
                  </span>
                </div>
              </Mount>
              <p className="hs-tag">{f.product}</p>
              <h3>{f.title}</h3>
              <p>
                {f.line} <Sample on={f.sample} />
              </p>
              {hasGuide(f.guide) && (
                <Link to={`/docs/${f.guide}`} className="link-arrow">
                  <span>Read the guide</span> <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* the smaller things: one slow marquee of pills, paused under the pointer; a still wrapped row
          under reduced motion (home.css). The second copy only closes the loop. */}
      <section className="hs hs-small" aria-labelledby="hs-small">
        <div className="wrap" data-reveal>
          <h2 id="hs-small" className="hs-title">
            And everything else a DM reaches for <Sample on={smallFeatures.some((s) => s.sample)} />
          </h2>
        </div>
        <div className="marquee" data-reveal>
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="marquee-list" aria-hidden={copy === 1 || undefined}>
                {smallFeatures.map((s) => {
                  const G = SMALL_ICON[s.icon];
                  return (
                    <li key={s.title} className="chip">
                      <span className="chip-ic">
                        <G size={22} aria-hidden="true" />
                      </span>
                      {s.title}
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* start here: six numbered pills along a dashed switchback, three out and three back */}
      <section className="wrap hs" aria-labelledby="hs-start">
        <div data-reveal>
          <h2 id="hs-start" className="hs-title">
            Your first session in six steps <Sample on={steps.some((s) => s.sample)} />
          </h2>
        </div>
        <div data-reveal>
          <ol className="route">
            {steps.map((s, i) => (
              <li key={s.guide} className={`stop s${i}`}>
                <Link to={guideHref(s.guide)}>
                  <span className="stop-pill">
                    <span className="stop-n tnum">{i + 1}</span>
                    {s.title}
                  </span>
                  <span className="stop-line">{s.line}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* the close: the date set large, the goblin at his fire, the waitlist field */}
      <section className="wrap hs hs-close" aria-labelledby="hs-close">
        <div data-reveal>
          <h2 id="hs-close" className="close-title">
            <span>Closed beta starts</span> <span>{BETA_STARTS}</span>
          </h2>
        </div>
        <div className="close-row" data-reveal>
          <div className="close-join">
            <p>The Dungeon Master&rsquo;s backstage. We&rsquo;re opening to a few tables first, so save yours.</p>
            <JoinInline />
          </div>
          <Mount className="close-frame">
            <Img p={closingPicture} />
          </Mount>
        </div>
      </section>
    </div>
  );
}
