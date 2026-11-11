import Link from 'next/link';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { SignText } from '@/components/ui/Sign';
import { Verify } from '@/components/ui/Verify';
import type { Category } from '@/lib/domain/types';
import styles from './Sections.module.css';

export function SectionHeader({ kicker, title, children, as: Tag = 'h2' }: { kicker: string; title: string; children?: ReactNode; as?: 'h1' | 'h2' }) {
  return (
    <div className={styles.sh}>
      <div>
        <div className="kick">{kicker}</div>
        <Tag>{title}</Tag>
      </div>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Inner-page title block. */
export function PageHero({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className={`${styles.pageHero} dots`}>
      <div className="wrap">
        <div className="kick">{kicker}</div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <div className={styles.hero} id="home">
      <div className={styles.banner}>
        <div className={`wrap ${styles.bannerInner}`}>
          <h1 className={styles.bannerH1}>
            <SignText className={styles.bannerSign} />
          </h1>
          <div className={styles.stripe} aria-hidden="true" />
        </div>
      </div>
      <div className={`wrap ${styles.heroBody}`}>
        <div>
          <h2>
            Barrie&apos;s game shop for <em>20+ years.</em>
          </h2>
          <p>Board games, D&amp;D, Warhammer, miniature paints and everything that goes with them. Lower level of the Bayfield Mall, next to Bowlerama and Service Ontario.</p>
          <div className={styles.ctas}>
            <ButtonLink href="/stock">Check stock</ButtonLink>
            <ButtonLink href="/events" variant="blue">
              See events
            </ButtonLink>
          </div>
        </div>
        <dl className={styles.creds}>
          <div>
            <dt>21</dt>
            <dd>
              years in Barrie
              <br />
              (since 2005) <Verify note='"21 years"' />
            </dd>
          </div>
          <div>
            <dt>94%</dt>
            <dd>
              recommend us
              <br />
              101 Facebook reviews <Verify note="94% and 101 reviews" />
            </dd>
          </div>
          <div>
            <dt>3.5K</dt>
            <dd>
              local gamers follow
              <br />
              our weekly updates <Verify note="3.5K followers" />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

const AISLES: { tag: string; title: string; text: string; note: string; category?: Category }[] = [
  { tag: 'Warhammer', title: 'Armies & codexes', text: '40K, starter sets, Kill Team and the big new boxes.', note: 'New: 40K Armageddon', category: 'Warhammer' },
  { tag: 'Paint wall', title: 'Miniature paints', text: 'A floor-to-ceiling wall of Citadel paints, brushes and hobby tools.', note: 'Every colour, ask if not', category: 'Paints' },
  { tag: 'StarCraft', title: 'StarCraft minis', text: 'Terran, Zerg and Protoss for the tabletop miniatures game.', note: 'Restock just landed', category: 'StarCraft' },
  { tag: 'D&D', title: 'D&D & RPGs', text: 'Core books, setting books, dice and everything for your table.', note: 'Eberron & Ravenloft in', category: 'D&D' },
  { tag: 'Cards', title: 'Trading card games', text: 'Booster boxes, packs, sleeves and deck boxes.', note: 'Riftbound: Origins in stock', category: 'Cards' },
  { tag: 'Board games', title: 'Board games', text: 'Family nights, party games and heavy strategy, wall to wall.', note: 'Ask for a recommendation', category: 'Board games' },
  { tag: 'Collect', title: 'Statues & figures', text: 'Life-size statues at the door, figures and collectibles inside.', note: 'Say hi on your way in' },
  { tag: 'Play', title: 'The playspace', text: 'Tables in the store to learn a game, paint, or play a match.', note: 'Free to use' },
];

export function Aisles() {
  return (
    <ul className={styles.aisles}>
      {AISLES.map((a) => (
        <li key={a.title} className={styles.aisle}>
          <span className={styles.tag}>{a.tag}</span>
          <h3>{a.title.replace('&', '&')}</h3>
          <p>{a.text}</p>
          <span className={styles.new}>
            {a.category ? <Link href={`/stock?category=${encodeURIComponent(a.category)}`}>{a.note}</Link> : a.note}
            {a.tag === 'Warhammer' || a.tag === 'D&D' || a.tag === 'Cards' ? <Verify note="new arrivals" /> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Reviews() {
  return (
    <ul className={styles.revs}>
      <li className={styles.rv}>
        <span className={styles.bigNum}>94%</span>
        <q>recommend us</q>
        <span className={styles.who}>
          101 reviews on Facebook <Verify note="count and percentage" />
        </span>
      </li>
      <li className={styles.rv}>
        <q>Excellent service, selection, prices, hours and playspace.</q>
        <span className={styles.who}>
          Facebook review <Verify note="quote and permission to use it" />
        </span>
      </li>
      <li className={styles.rv}>
        <q>Staff is great, selection is huge.</q>
        <span className={styles.who}>
          Facebook review <Verify note="quote and permission to use it" />
        </span>
      </li>
    </ul>
  );
}
