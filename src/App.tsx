import { useMemo, useState } from "react";
import { BookOpen, Menu, Search, Shield, Info } from "lucide-react";

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

export default function App() {
  const surahs = useMemo(
    () =>
      Object.entries(data).map(([number, surah]) => ({
        number,
        name: surah.name,
        verseCount: Object.keys(surah.verses).length,
      })),
    [],
  );

  const [query, setQuery] = useState("");
  const [activeSurah, setActiveSurah] = useState(surahs[0]?.number ?? "1");
  const [page, setPage] = useState<"read" | "about" | "privacy">("read");

  const filtered = surahs.filter((surah) => {
    const q = query.trim().toLowerCase();
    return !q || `${surah.number} ${surah.name}`.toLowerCase().includes(q);
  });

  const current = data[activeSurah] ?? data[surahs[0]?.number ?? "1"];

  if (surahs.length === 0) {
    return (
      <div className="app-shell">
        <section className="panel page">
          <h1>Il-Quran bil-Malti</h1>
          <p>No Quran data loaded yet. Check the JSON chunk files in <code>src/data/quran</code>.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero panel">
        <div>
          <p className="eyebrow">Il-Quran bil-Malti</p>
          <h1>Maltese Quran reader</h1>
          <p className="lede">
            Clean, static, and simple. The site reads directly from local JSON so there is no
            backend layer to break deployment.
          </p>
        </div>
        <div className="hero-badge">
          <Shield size={18} />
          <span>Static-first launch base</span>
        </div>
      </header>

      <section className="toolbar panel">
        <Search size={18} />
        <input
          aria-label="Search surahs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search surah number or name"
        />
      </section>

      <nav className="nav-row">
        <button className={page === "read" ? "nav-chip active" : "nav-chip"} onClick={() => setPage("read")}>
          <BookOpen size={16} /> Reader
        </button>
        <button className={page === "about" ? "nav-chip active" : "nav-chip"} onClick={() => setPage("about")}>
          <Info size={16} /> About
        </button>
        <button className={page === "privacy" ? "nav-chip active" : "nav-chip"} onClick={() => setPage("privacy")}>
          <Menu size={16} /> Privacy
        </button>
      </nav>

      {page === "read" && (
        <main className="content-grid">
          <aside className="panel list-panel">
            <div className="panel-title">
              <BookOpen size={18} />
              <span>Surahs</span>
            </div>
            <div className="surah-list">
              {filtered.map((surah) => (
                <button
                  key={surah.number}
                  className={surah.number === activeSurah ? "surah-item active" : "surah-item"}
                  onClick={() => setActiveSurah(surah.number)}
                >
                  <strong>
                    {surah.number}. {surah.name}
                  </strong>
                  <span>{surah.verseCount} verses</span>
                </button>
              ))}
            </div>
          </aside>

          <article className="panel reader-panel">
            <div className="panel-title">
              <BookOpen size={18} />
              <span>{current?.name}</span>
            </div>
            <div className="verses">
              {Object.entries(current?.verses ?? {}).map(([verseNumber, verse]) => (
                <div className="verse" key={verseNumber}>
                  <div className="verse-number">{verseNumber}</div>
                  <p>{verse.translation}</p>
                </div>
              ))}
            </div>
          </article>
        </main>
      )}

      {page === "about" && (
        <section className="panel page">
          <h2>About</h2>
          <p>
            This is the clean public website base for maltiquran.com. It uses local Quran JSON
            data and keeps the UI simple so deployments stay predictable.
          </p>
        </section>
      )}

      {page === "privacy" && (
        <section className="panel page">
          <h2>Privacy</h2>
          <p>
            No user accounts and no built-in tracking. The site serves static content from the
            repo.
          </p>
        </section>
      )}
    </div>
  );
}
