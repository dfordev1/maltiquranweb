import { useEffect, useMemo } from "react";
import { Link, NavLink, Route, Routes, useLocation, useParams } from "react-router-dom";
import { BookOpen, Home, Info, Search, Shield, ChevronRight, Smartphone } from "lucide-react";

type Verse = { translation: string };
type Surah = { name: string; verses: Record<string, Verse> };

const chunkModules = import.meta.glob("./data/quran/*.json", {
  eager: true,
  import: "default",
});

const data = Object.fromEntries(
  Object.entries(chunkModules)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, module]) => Object.entries(module as Record<string, Surah>)),
) as Record<string, Surah>;

function fixMojibake(value: string) {
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function normalizeSurah(surah: Surah): Surah {
  return {
    name: fixMojibake(surah.name),
    verses: Object.fromEntries(
      Object.entries(surah.verses).map(([verseNumber, verse]) => [
        verseNumber,
        { translation: fixMojibake(verse.translation) },
      ]),
    ),
  };
}

const normalizedData = Object.fromEntries(
  Object.entries(data).map(([number, surah]) => [number, normalizeSurah(surah)]),
) as Record<string, Surah>;

type SurahEntry = {
  number: string;
  name: string;
  verseCount: number;
  slug: string;
};

const surahs: SurahEntry[] = Object.entries(normalizedData).map(([number, surah]) => ({
  number,
  name: surah.name,
  verseCount: Object.keys(surah.verses).length,
  slug: slugify(surah.name),
}));

const playStoreUrl = "https://play.google.com/store/apps/details?id=com.malti.quran";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setSeo({ title, description, canonical }: { title: string; description: string; canonical: string }) {
  document.title = title;
  const upsertMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
    let tag = document.head.querySelector<HTMLMetaElement>(`${selector}[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.content = value;
  };
  const upsertLink = (rel: string, href: string) => {
    let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!tag) {
      tag = document.createElement("link");
      tag.rel = rel;
      document.head.appendChild(tag);
    }
    tag.href = href;
  };
  upsertMeta("meta", "name", "description", description);
  upsertMeta("meta", "property", "og:title", title);
  upsertMeta("meta", "property", "og:description", description);
  upsertMeta("meta", "property", "og:url", canonical);
  upsertMeta("meta", "name", "twitter:title", title);
  upsertMeta("meta", "name", "twitter:description", description);
  upsertLink("canonical", canonical);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell retro-shell">
      <header className="site-header">
        <div className="masthead">
          <div className="masthead-title">
            <p className="eyebrow">Il-Quran bil-Malti</p>
            <h1>Maltese Quran</h1>
          </div>
          <div className="masthead-links">
            <span>English</span>
            <span>Malti</span>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <a href={playStoreUrl} target="_blank" rel="noreferrer">
              Android app
            </a>
          </div>
        </div>
        <div className="site-strip">
          <span>Simple reading layout</span>
          <span>Static-first</span>
          <span>Plain Maltese text</span>
          <span>Archive-inspired frame</span>
        </div>
      </header>
      {children}
      <footer className="site-footer panel">
        <Link to="/">Mappa tas-Sit</Link>
        <span>|</span>
        <Link to="/about">About</Link>
        <span>|</span>
        <Link to="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}

function HomePage() {
  const { search } = useLocation();
  const q = new URLSearchParams(search).get("q")?.trim().toLowerCase() ?? "";
  const filtered = useMemo(
    () => surahs.filter((surah) => !q || `${surah.number} ${surah.name}`.toLowerCase().includes(q)),
    [q],
  );

  useEffect(() => {
    setSeo({
      title: "Il-Quran bil-Malti",
      description: "A clean Maltese Quran reader with real surah pages, fast search, and static content.",
      canonical: "https://maltiquran.com/",
    });
  }, []);

  return (
    <Shell>
      <section className="searchbar panel">
        <div className="searchbar-label">Search</div>
        <Search size={16} />
        <input
          aria-label="Search surahs"
          defaultValue={q}
          onChange={(event) => {
            const url = new URL(window.location.href);
            if (event.target.value.trim()) url.searchParams.set("q", event.target.value);
            else url.searchParams.delete("q");
            window.history.replaceState({}, "", `${url.pathname}${url.search}`);
          }}
          placeholder="Search surah number or name"
        />
      </section>

      <main className="content-grid home-grid">
        <aside className="panel list-panel">
          <div className="section-head">
            <BookOpen size={16} />
            <span>Surahs</span>
          </div>
          <p className="list-caption">Pick a chapter.</p>
          <div className="surah-list">
            {filtered.map((surah) => (
              <Link key={surah.number} to={`/surah/${surah.number}-${surah.slug}`} className="surah-item">
                <strong>
                  {surah.number}. {surah.name}
                </strong>
                <span>{surah.verseCount} verses</span>
              </Link>
            ))}
          </div>
        </aside>

        <article className="panel reader-panel">
          <div className="section-head">
            <BookOpen size={16} />
            <span>Welcome</span>
          </div>
          <div className="page page-landing">
            <h2>Select a surah to begin</h2>
            <div className="page-note">
              <ChevronRight size={14} />
              <span>The site opens each chapter on its own page.</span>
            </div>
          </div>
        </article>
      </main>
    </Shell>
  );
}

function SurahPage() {
  const { id } = useParams();
  const number = id?.split("-")[0] ?? "";
  const surah = normalizedData[number];

  useEffect(() => {
    if (!surah) return;
    setSeo({
      title: `Surah ${surah.name} | Il-Quran bil-Malti`,
      description: `Read Surah ${surah.name} in Maltese on Il-Quran bil-Malti.`,
      canonical: `https://maltiquran.com/surah/${number}-${slugify(surah.name)}`,
    });
  }, [number, surah]);

  if (!surah) {
    return (
      <Shell>
        <section className="panel page">
          <h2>Surah not found</h2>
          <p>The requested surah does not exist.</p>
          <Link className="nav-chip active" to="/">
            Back home
          </Link>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>{surah.name}</span>
      </div>

      <main className="content-grid surah-grid">
        <article className="panel reader-panel">
          <div className="surah-header">
            <div>
              <p className="eyebrow">Surah {number}</p>
              <h2>{surah.name}</h2>
              <p className="surah-meta">{Object.keys(surah.verses).length} verses</p>
            </div>
            <a className="text-link subtle" href={playStoreUrl} target="_blank" rel="noreferrer">
              Android app
            </a>
          </div>
          <div className="verses">
            {Object.entries(surah.verses).map(([verseNumber, verse]) => (
              <div className="verse" key={verseNumber}>
                <div className="verse-number">{verseNumber}</div>
                <p>{verse.translation}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel list-panel related-panel">
          <div className="section-head">
            <Shield size={18} />
            <span>More surahs</span>
          </div>
          <p className="list-caption">Jump to nearby chapters or go back home.</p>
          <div className="surah-list">
            {surahs.slice(Math.max(0, Number(number) - 3), Number(number) + 2).map((item) => (
              <Link key={item.number} className="surah-item" to={`/surah/${item.number}-${item.slug}`}>
                <strong>
                  {item.number}. {item.name}
                </strong>
                <span>{item.verseCount} verses</span>
              </Link>
            ))}
          </div>
        </aside>
      </main>
    </Shell>
  );
}

function StaticPage({ title, body, path }: { title: string; body: string; path: string }) {
  useEffect(() => {
    setSeo({
      title: `${title} | Il-Quran bil-Malti`,
      description: body,
      canonical: `https://maltiquran.com${path}`,
    });
  }, [body, path, title]);

  return (
    <Shell>
      <section className="panel page">
        <h2>{title}</h2>
        <p>{body}</p>
      </section>
    </Shell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/surah/:id" element={<SurahPage />} />
      <Route
        path="/about"
        element={
          <StaticPage
            title="About"
            body="This is the clean public website base for maltiquran.com."
            path="/about"
          />
        }
      />
      <Route
        path="/privacy"
        element={
          <StaticPage
            title="Privacy"
            body="No user accounts and no built-in tracking. The site serves static content from the repo."
            path="/privacy"
          />
        }
      />
    </Routes>
  );
}
