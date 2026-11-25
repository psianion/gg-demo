import Sample from '../Sample';
import { usePageMeta, useReveal } from '../meta';
import { Arrow } from '../ui';
import { aboutSections, signOff } from '../content/about';
import { licence, links } from '../content/links';

// /about: a large lead (the hero's own true lines), then each section with its heading on the left and
// its text on the right, the sign-off, how to get in touch and the licence. Words from content/about.ts.

export default function About() {
  usePageMeta('About', 'Why Good Goblin is a free, open-source virtual tabletop that keeps your table on your own machine: where it started, how it is designed and what it commits to.');
  useReveal();
  return (
    <div className="wrap page-inner">
      <header className="page-head">
        <h1>About</h1>
      </header>
      <p className="about-lead">
        A free, open-source virtual tabletop, built for D&amp;D and ready for any tabletop RPG. Dynamic lighting, live
        fog of war, multi-level maps and full control of your table. Hosted on your own machine. Players join in the
        browser, with nothing to install.
      </p>
      <div className="about-sections">
        {aboutSections.map((s) => (
          <section key={s.id} className="grid about-row" aria-labelledby={`ab-${s.id}`} data-reveal>
            <h2 id={`ab-${s.id}`}>{s.heading}</h2>
            <div>
              {s.paragraphs.map((t, n) => (
                <p key={t}>
                  {t}
                  {n === s.paragraphs.length - 1 && <Sample on={s.sample} />}
                </p>
              ))}
            </div>
          </section>
        ))}
        <section className="grid about-row" aria-label="Sign-off" data-reveal>
          <div>
            <p className="sign-off">
              {signOff.text}
              <Sample on={signOff.sample} />
            </p>
          </div>
        </section>
        <section className="grid about-row" aria-labelledby="ab-contact" data-reveal>
          <h2 id="ab-contact">Get in touch</h2>
          <div>
            <ul className="contact">
              {[links.github, links.discord, links.email].map((l) => (
                <li key={l.label}>
                  <a className="btn quiet" href={l.href}>
                    {l.label} <Arrow />
                  </a>
                </li>
              ))}
            </ul>
            <Sample on={links.github.sample || links.discord.sample || links.email.sample} />
          </div>
        </section>
        <section className="grid about-row" aria-labelledby="ab-licence" data-reveal>
          <h2 id="ab-licence">Licence</h2>
          <div>
            <p>
              {licence.text}
              <Sample on={licence.sample} />
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
