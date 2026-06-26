"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Globe, Menu, Search, User, Volume2 } from "lucide-react";
import { defaultSurahId, normalizedData, playStoreUrl, slugify, surahs } from "@/lib/quran";

type PageProps = {
  title?: string;
  body?: string;
  path?: string;
  surahId?: string;
};

function setSeo(title: string, description: string, canonical: string) {
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

export function Shell({ children }: { children: React.ReactNode }) {
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

function Toolbar({ currentValue, onChange }: { currentValue: string; onChange: (value: string) => void }) {
  return (
    <div className="toolbar-row">
      <select className="select-box" aria-label="Select chapter" value={currentValue} onChange={(event) => onChange(event.target.value)}>
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
  );
}

export function HomeReader() {
  const router = useRouter();

  useEffect(() => {
    setSeo("Il-Quran bil-Malti", "A clean Maltese Quran reader with real surah pages, fast search, and static content.", "https://maltiquran.com/");
  }, []);

  const fatiha = normalizedData["1"];

  return (
    <Shell>
      <Toolbar currentValue={defaultSurahId} onChange={(value) => router.push(`/surah/${value}`)} />
      <main className="content-grid home-grid">
        <article className="panel reader-panel">
          <div className="surah-header">
            <h2>{fatiha?.name ?? "Al-Fatiha"}</h2>
          </div>
          <div className="verses">
            {Object.entries(fatiha?.verses ?? {}).map(([verseNumber, verse]) => (
              <div className="verse" key={verseNumber}>
                <div className="verse-number">{verseNumber}</div>
                <p>{verse.translation}</p>
              </div>
            ))}
          </div>
        </article>
      </main>
    </Shell>
  );
}

export function SurahReader({ surahId }: PageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const number = surahId?.split("-")[0] ?? "";
  const surah = normalizedData[number];
  const currentIndex = surahs.findIndex((item) => item.number === number);
  const previousSurah = currentIndex > 0 ? surahs[currentIndex - 1] : null;
  const nextSurah = currentIndex >= 0 && currentIndex < surahs.length - 1 ? surahs[currentIndex + 1] : null;

  useEffect(() => {
    if (!surah) return;
    setSeo(`Surah ${surah.name} | Il-Quran bil-Malti`, `Read Surah ${surah.name} in Maltese on Il-Quran bil-Malti.`, `https://maltiquran.com${pathname}`);
  }, [pathname, surah]);

  if (!surah) return null;

  return (
    <Shell>
      <main className="content-grid surah-grid">
        <div className="toolbar-row page-toolbar">
          <Toolbar currentValue={surahId ?? defaultSurahId} onChange={(value) => router.push(`/surah/${value}`)} />
        </div>
        <button className="nav-arrow left" type="button" aria-label="Previous chapter" disabled={!previousSurah} onClick={() => previousSurah && router.push(`/surah/${previousSurah.number}-${previousSurah.slug}`)}>
          <ChevronLeft size={22} />
        </button>
        <article className="panel reader-panel">
          <div className="surah-header">
            <h2>{surah.name}</h2>
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
        <button className="nav-arrow right" type="button" aria-label="Next chapter" disabled={!nextSurah} onClick={() => nextSurah && router.push(`/surah/${nextSurah.number}-${nextSurah.slug}`)}>
          <ChevronRight size={22} />
        </button>
      </main>
    </Shell>
  );
}

export function StaticPage({ title, body, path }: { title: string; body: string; path: string }) {
  useEffect(() => {
    setSeo(`${title} | Il-Quran bil-Malti`, body, `https://maltiquran.com${path}`);
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
