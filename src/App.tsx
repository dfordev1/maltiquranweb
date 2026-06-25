import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, Globe, Menu, Search, User, Volume2 } from "lucide-react";

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

const parallelModules = import.meta.glob("./data/parallel/*.json", {
  eager: true,
  import: "default",
});

type ParallelVerse = { ArabicPersianScript?: string; Translation?: string };
type ParallelSurah = { name?: string; verses: Record<string, ParallelVerse> };

const parallelData = Object.fromEntries(
  Object.entries(parallelModules)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, module]) => Object.entries(module as Record<string, ParallelSurah>)),
) as Record<string, ParallelSurah>;

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

function normalizeParallelSurah(surah: ParallelSurah): ParallelSurah {
  return {
    name: fixMojibake(surah.name ?? ""),
    verses: Object.fromEntries(
      Object.entries(surah.verses).map(([verseNumber, verse]) => [
        verseNumber,
        {
          ArabicPersianScript: fixMojibake(verse.ArabicPersianScript ?? ""),
          Translation: fixMojibake(verse.Translation ?? ""),
        },
      ]),
    ),
  };
}

const normalizedData = Object.fromEntries(
  Object.entries(data).map(([number, surah]) => [number, normalizeSurah(surah)]),
) as Record<string, Surah>;

const normalizedParallelData = Object.fromEntries(
  Object.entries(parallelData).map(([key, surah]) => {
    const number = key.split(".")[0].trim();
    return [number, normalizeParallelSurah(surah)];
  }),
) as Record<string, ParallelSurah>;

type SurahEntry = {
  number: string;
  name: string;
  verseCount: number;
  slug: string;
};

type ReaderMode = "single" | "parallel";

const surahs: SurahEntry[] = Object.entries(normalizedData).map(([number, surah]) => ({
  number,
  name: surah.name,
  verseCount: Object.keys(surah.verses).length,
  slug: slugify(surah.name),
}));

const playStoreUrl = "https://play.google.com/store/apps/details?id=com.malti.quran";
const defaultSurahId = "1-al-fatiha";

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
    <div className="app-shell bible-shell">
      <header className="topbar">
        <div className="brand">Il-Quran bil-Malti</div>
        <form className="search-pill" onSubmit={(event) => event.preventDefault()}>
          <Search size={18} />
          <input aria-label="Search verses, topics, and questions" placeholder="Search verses, topics, and questions..." />
        </form>
        <div className="top-actions">
          <a className="app-link" href={playStoreUrl} target="_blank" rel="noreferrer">
            Get the app
          </a>
          <button type="button" className="icon-btn" aria-label="Language">
            <Globe size={22} />
          </button>
          <button type="button" className="icon-btn" aria-label="Menu">
            <Menu size={22} />
          </button>
          <button type="button" className="icon-btn" aria-label="Account">
            <User size={22} />
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

function HomePage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ReaderMode>("single");
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
      <div className="mode-row">
        <button type="button" className={mode === "single" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("single")}>
          Reader
        </button>
        <button type="button" className={mode === "parallel" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("parallel")}>
          Parallel
        </button>
      </div>

      <div className="toolbar-row">
        <select
          className="select-box"
          aria-label="Select chapter"
          defaultValue={defaultSurahId}
          onChange={(event) => {
            if (!event.target.value) return;
            navigate(`/surah/${event.target.value}`);
          }}
        >
          <option value={defaultSurahId}>Chapter</option>
          {surahs.map((surah) => (
            <option key={surah.number} value={`${surah.number}-${surah.slug}`}>
              {surah.number}. {surah.name}
            </option>
          ))}
        </select>
        <select className="select-box" aria-label="Select version" defaultValue="Malti">
          <option value="Malti">Malti</option>
          <option value="NIV">NIV</option>
        </select>
        <div className="utility-icons">
          <span className="parallel-link">
            <BookOpen size={14} /> Parallel
          </span>
          <button type="button" className="circle-btn" aria-label="Audio">
            <Volume2 size={18} />
          </button>
          <button type="button" className="circle-btn" aria-label="Text size">
            <span className="aa">AA</span>
          </button>
        </div>
      </div>

      <main className={mode === "parallel" ? "content-grid home-grid parallel-home" : "content-grid home-grid"}>
        <article className="panel reader-panel landing-panel">
          <div className="page page-landing">
            <h2>Select a chapter</h2>
            <div className="page-note">
              <ChevronRight size={14} />
              <span>Each chapter opens on its own page.</span>
            </div>
            {mode === "parallel" ? <p className="parallel-hint">Parallel mode opens two panes on chapter pages.</p> : null}
          </div>
        </article>
      </main>
    </Shell>
  );
}

function SurahPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const number = id?.split("-")[0] ?? "";
  const surah = normalizedData[number];
  const [mode, setMode] = useState<ReaderMode>("parallel");
  const currentIndex = surahs.findIndex((item) => item.number === number);
  const previousSurah = currentIndex > 0 ? surahs[currentIndex - 1] : null;
  const nextSurah = currentIndex >= 0 && currentIndex < surahs.length - 1 ? surahs[currentIndex + 1] : null;
  const parallelSurah = normalizedParallelData[number];

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
      <div className="mode-row">
        <button type="button" className={mode === "single" ? "mode-pill" : "mode-pill"} onClick={() => setMode("single")}>
          Reader
        </button>
        <button type="button" className={mode === "parallel" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("parallel")}>
          Parallel
        </button>
      </div>

      <main className="content-grid surah-grid">
        <div className="toolbar-row page-toolbar">
          <select
            className="select-box"
            aria-label="Select chapter"
            value={id ?? ""}
            onChange={(event) => {
              if (!event.target.value) return;
              navigate(`/surah/${event.target.value}`);
            }}
          >
            <option value="1-al-fatiha">Chapter</option>
            {surahs.map((item) => (
              <option key={item.number} value={`${item.number}-${item.slug}`}>
                {item.number}. {item.name}
              </option>
            ))}
          </select>
          <select className="select-box" aria-label="Select version" defaultValue="Malti">
            <option value="Malti">Malti</option>
            <option value="NIV">NIV</option>
          </select>
          <div className="utility-icons">
            <span className="parallel-link">
              <BookOpen size={14} /> Parallel
            </span>
            <button type="button" className={mode === "parallel" ? "mode-pill active" : "mode-pill"} onClick={() => setMode(mode === "parallel" ? "single" : "parallel")}>
              {mode === "parallel" ? "Exit Parallel Mode" : "Parallel Mode"}
            </button>
            <button type="button" className="circle-btn" aria-label="Audio">
              <Volume2 size={18} />
            </button>
            <button type="button" className="circle-btn" aria-label="Text size">
              <span className="aa">AA</span>
            </button>
          </div>
        </div>

        <div className={mode === "parallel" ? "reader-stage parallel" : "reader-stage"}>
          <button
            className="nav-arrow left"
            type="button"
            aria-label="Previous chapter"
            disabled={!previousSurah}
            onClick={() => previousSurah && navigate(`/surah/${previousSurah.number}-${previousSurah.slug}`)}
          >
            <ChevronLeft size={22} />
          </button>

          {mode === "parallel" ? (
            <div className="parallel-grid">
              <ReaderPane title={`Chapter ${number}`} surah={surah} />
              <ParallelPane title={`Chapter ${number}`} surah={parallelSurah ?? { name: surah.name, verses: {} }} />
            </div>
          ) : (
            <ReaderPane title={`Chapter ${number}`} surah={surah} />
          )}

          <button
            className="nav-arrow right"
            type="button"
            aria-label="Next chapter"
            disabled={!nextSurah}
            onClick={() => nextSurah && navigate(`/surah/${nextSurah.number}-${nextSurah.slug}`)}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </main>
    </Shell>
  );
}

function ReaderPane({ title, surah }: { title: string; surah: Surah }) {
  return (
    <article className="panel reader-panel">
      <div className="surah-header">
        <div>
          <p className="chapter-label">{title}</p>
          <h2>{surah.name}</h2>
        </div>
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
  );
}

function ParallelPane({ title, surah }: { title: string; surah?: ParallelSurah }) {
  return (
    <article className="panel reader-panel">
      <div className="surah-header">
        <div>
          <p className="chapter-label">{title}</p>
          <h2>{surah?.name || ""}</h2>
        </div>
      </div>
      <div className="parallel-verses">
        {Object.entries(surah?.verses ?? {}).map(([verseNumber, verse]) => (
          <div className="parallel-verse" key={verseNumber}>
            <div className="verse-number">{verseNumber}</div>
            <div className="parallel-texts">
              <p>{verse.ArabicPersianScript ?? ""}</p>
              <p>{verse.Translation ?? ""}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
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
