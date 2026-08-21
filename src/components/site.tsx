"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { defaultSurahId, normalizedData, surahs } from "@/lib/quran";

type PageProps = {
  title?: string;
  body?: string;
  path?: string;
  surahId?: string;
};

function setSeo(title: string, description: string, canonical: string) {
  document.title = title;
  const upsertMeta = (attr: "name" | "property", key: string, value: string) => {
    let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.content = value;
  };
  let canonicalTag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalTag) {
    canonicalTag = document.createElement("link");
    canonicalTag.rel = "canonical";
    document.head.appendChild(canonicalTag);
  }
  canonicalTag.href = canonical;
  upsertMeta("name", "description", description);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonical);
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="Il-Quran bil-Malti home">
            <span className="brand-mark">Q</span>
            <span>Il-Quran bil-Malti</span>
          </a>
          <form className="header-search" onSubmit={(event) => event.preventDefault()}>
            <Search size={17} aria-hidden="true" />
            <input aria-label="Fittex fil-Quran" placeholder="Fittex fil-Quran…" />
          </form>
          <nav className="header-nav" aria-label="Main navigation">
            <a href="/about">Dwar</a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

function ChapterControls({
  currentValue,
  onChange,
  previous,
  next,
  onPrevious,
  onNext,
}: {
  currentValue: string;
  onChange: (value: string) => void;
  previous?: boolean;
  next?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="reader-controls-wrap">
      <div className="reader-controls">
        <button className="chapter-nav-button" type="button" aria-label="Surah ta' qabel" disabled={!previous} onClick={onPrevious}>
          <ChevronLeft size={19} />
        </button>
        <label className="chapter-picker">
          <span className="sr-only">Agħżel surah</span>
          <select value={currentValue} onChange={(event) => onChange(event.target.value)} aria-label="Agħżel surah">
            {surahs.map((surah) => (
              <option key={surah.number} value={`${surah.number}-${surah.slug}`}>
                {surah.number}. {surah.name}
              </option>
            ))}
          </select>
        </label>
        <button className="chapter-nav-button" type="button" aria-label="Surah li jmiss" disabled={!next} onClick={onNext}>
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}

function Reader({ surah }: { surah: NonNullable<(typeof normalizedData)[string]> }) {
  const verses = Object.entries(surah.verses);
  return (
    <main className="reader-shell">
      <article className="reader-card">
        <header className="surah-header">
          <div className="surah-kicker">Surah</div>
          <h1>{surah.name}</h1>
          <div className="surah-meta">{verses.length} versi</div>
        </header>
        <div className="verses">
          {verses.map(([verseNumber, verse]) => (
            <div className="verse" key={verseNumber}>
              <span className="verse-number" aria-label={`Vers ${verseNumber}`}>{verseNumber}</span>
              <p>{verse.translation}</p>
            </div>
          ))}
        </div>
      </article>
    </main>
  );
}

export function HomeReader() {
  const router = useRouter();
  const fatiha = normalizedData["1"];

  useEffect(() => {
    setSeo("Il-Quran bil-Malti", "Aqra l-Quran bil-Malti f'qarrej nadif u sempliċi.", "https://maltiquran.com/");
  }, []);

  if (!fatiha) return null;

  return (
    <Shell>
      <ChapterControls currentValue={defaultSurahId} onChange={(value) => router.push(`/surah/${value}`)} next onNext={() => router.push(`/surah/${surahs[1].number}-${surahs[1].slug}`)} />
      <Reader surah={fatiha} />
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
    setSeo(`Surah ${surah.name} | Il-Quran bil-Malti`, `Aqra Surah ${surah.name} bil-Malti.`, `https://maltiquran.com${pathname}`);
  }, [pathname, surah]);

  if (!surah) return null;

  return (
    <Shell>
      <ChapterControls
        currentValue={surahId ?? defaultSurahId}
        onChange={(value) => router.push(`/surah/${value}`)}
        previous={Boolean(previousSurah)}
        next={Boolean(nextSurah)}
        onPrevious={() => previousSurah && router.push(`/surah/${previousSurah.number}-${previousSurah.slug}`)}
        onNext={() => nextSurah && router.push(`/surah/${nextSurah.number}-${nextSurah.slug}`)}
      />
      <Reader surah={surah} />
    </Shell>
  );
}

export function StaticPage({ title, body, path }: { title: string; body: string; path: string }) {
  useEffect(() => {
    setSeo(`${title} | Il-Quran bil-Malti`, body, `https://maltiquran.com${path}`);
  }, [body, path, title]);

  return (
    <Shell>
      <main className="static-shell">
        <section className="static-card">
          <h1>{title}</h1>
          <p>{body}</p>
        </section>
      </main>
    </Shell>
  );
}
