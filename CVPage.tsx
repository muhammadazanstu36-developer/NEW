import type { CSSProperties, ReactNode } from "react";
import { bulletsOf, dates, linesOf, listOf, type CV, type TemplateKey } from "@/lib/cv";

/** A4 at 96 dpi. The page is always drawn at this size and scaled down on small screens. */
export const PAGE_W = 794;
/** A4 is 1122.5px tall at 96 dpi. Staying a little under stops a blank second page from printing. */
export const PAGE_H = 1118;
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const INK = "#111827";
const GREY = "#6b7280";
const BODY = "#374151";

interface Props {
  cv: CV;
  template: TemplateKey;
  color: string;
}

function Photo({ cv, size }: { cv: CV; size: number }) {
  if (!cv.photo) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cv.photo}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "cover", display: "block", borderRadius: cv.photoShape === "circle" ? "50%" : 12 }}
    />
  );
}

function Heading({ children, color, light }: { children: ReactNode; color: string; light?: boolean }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: light ? "#ffffff" : color,
        borderBottom: `1.5px solid ${light ? "rgba(255,255,255,0.55)" : color}`,
        paddingBottom: 4,
        marginBottom: 10
      }}
    >
      {children}
    </div>
  );
}

function Experience({ cv, color }: { cv: CV; color: string }) {
  const items = cv.experience.filter((e) => e.role || e.company);
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: 20 }}>
      <Heading color={color}>Experience</Heading>
      {items.map((e) => {
        const b = bulletsOf(e.bullets);
        return (
          <div key={e.id} style={{ marginBottom: 14, breakInside: "avoid" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <b style={{ fontSize: 14, color: INK }}>{e.role}</b>
              <span style={{ fontSize: 12, color: GREY, whiteSpace: "nowrap" }}>{dates(e.start, e.end)}</span>
            </div>
            {e.company && <div style={{ fontSize: 13, color, fontWeight: 600 }}>{e.company}</div>}
            {b.length > 0 && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5, color: BODY }}>
                {b.map((x, i) => <li key={i} style={{ marginBottom: 2 }}>{x}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

function Education({ cv, color }: { cv: CV; color: string }) {
  const items = cv.education.filter((e) => e.degree || e.school);
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: 20 }}>
      <Heading color={color}>Education</Heading>
      {items.map((e) => (
        <div key={e.id} style={{ marginBottom: 10, breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <b style={{ fontSize: 13.5, color: INK }}>{e.degree}</b>
            <span style={{ fontSize: 12, color: GREY, whiteSpace: "nowrap" }}>{dates(e.start, e.end)}</span>
          </div>
          {e.school && <div style={{ fontSize: 12.5, color: BODY }}>{e.school}</div>}
        </div>
      ))}
    </section>
  );
}

function Summary({ cv, color }: { cv: CV; color: string }) {
  if (!cv.summary.trim()) return null;
  return (
    <section style={{ marginBottom: 20 }}>
      <Heading color={color}>Profile</Heading>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: BODY }}>{cv.summary}</p>
    </section>
  );
}

/** Skills, languages and certificates as a simple block (used in the side column and the classic template). */
function Lists({ cv, color, light }: { cv: CV; color: string; light?: boolean }) {
  const txt = light ? "#ffffff" : BODY;
  const blocks: [string, string[]][] = [
    ["Skills", listOf(cv.skills)],
    ["Languages", listOf(cv.languages)],
    ["Certificates", listOf(cv.certs)]
  ];
  return (
    <>
      {blocks.map(([title, items]) =>
        items.length ? (
          <section key={title} style={{ marginBottom: 20 }}>
            <Heading color={color} light={light}>{title}</Heading>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, lineHeight: 1.65, color: txt }}>
              {items.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </section>
        ) : null
      )}
    </>
  );
}

function contactLines(cv: CV): string[] {
  return [cv.email, cv.phone, cv.location, ...linesOf(cv.links)].filter(Boolean);
}

/* ---------------- Modern: coloured sidebar ---------------- */
function Modern({ cv, color }: { cv: CV; color: string }) {
  const contact = contactLines(cv);
  return (
    <div style={{ width: PAGE_W, minHeight: PAGE_H, display: "flex", fontFamily: FONT, color: INK, background: `linear-gradient(to right, ${color} 260px, #ffffff 260px)` }}>
      <aside style={{ width: 260, boxSizing: "border-box", padding: "36px 24px", color: "#ffffff", flexShrink: 0 }}>
        {cv.photo && <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Photo cv={cv} size={150} /></div>}
        {contact.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <Heading color={color} light>Contact</Heading>
            {contact.map((c, i) => <div key={i} style={{ fontSize: 12, lineHeight: 1.6, wordBreak: "break-word" }}>{c}</div>)}
          </section>
        )}
        <Lists cv={cv} color={color} light />
      </aside>
      <main style={{ flex: 1, boxSizing: "border-box", padding: "40px 38px 40px 34px", minWidth: 0, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" } as CSSProperties}>
        <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1, fontWeight: 800, color }}>{cv.name || "Your Name"}</h1>
        {cv.title && <div style={{ marginTop: 6, marginBottom: 22, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase", color: GREY }}>{cv.title}</div>}
        {!cv.title && <div style={{ height: 22 }} />}
        <Summary cv={cv} color={color} />
        <Experience cv={cv} color={color} />
        <Education cv={cv} color={color} />
      </main>
    </div>
  );
}

/* ---------------- Classic: single column ---------------- */
function Classic({ cv, color }: { cv: CV; color: string }) {
  const contact = [cv.email, cv.phone, cv.location, ...linesOf(cv.links)].filter(Boolean);
  return (
    <div style={{ width: PAGE_W, minHeight: PAGE_H, boxSizing: "border-box", padding: "44px 52px", fontFamily: FONT, color: INK, background: "#ffffff" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, borderBottom: `3px solid ${color}`, paddingBottom: 18, marginBottom: 22 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, fontWeight: 800, color: INK }}>{cv.name || "Your Name"}</h1>
          {cv.title && <div style={{ marginTop: 6, fontSize: 15, color }}>{cv.title}</div>}
          {contact.length > 0 && <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, color: GREY }}>{contact.join("  •  ")}</div>}
        </div>
        {cv.photo && <Photo cv={cv} size={116} />}
      </header>
      <Summary cv={cv} color={color} />
      <Experience cv={cv} color={color} />
      <Education cv={cv} color={color} />
      <Lists cv={cv} color={color} />
    </div>
  );
}

/* ---------------- Banner: coloured header, two columns ---------------- */
function Banner({ cv, color }: { cv: CV; color: string }) {
  const contact = [cv.email, cv.phone, cv.location, ...linesOf(cv.links)].filter(Boolean);
  return (
    <div style={{ width: PAGE_W, minHeight: PAGE_H, display: "flex", flexDirection: "column", fontFamily: FONT, color: INK, background: "#ffffff" }}>
      <header style={{ background: color, color: "#ffffff", padding: "34px 44px", display: "flex", alignItems: "center", gap: 26 }}>
        {cv.photo && <Photo cv={cv} size={124} />}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{cv.name || "Your Name"}</h1>
          {cv.title && <div style={{ marginTop: 6, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", opacity: 0.92 }}>{cv.title}</div>}
          {contact.length > 0 && <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, opacity: 0.95 }}>{contact.join("  •  ")}</div>}
        </div>
      </header>
      <div style={{ display: "flex", flex: 1, background: "linear-gradient(to right, #ffffff 478px, #f3f4f6 478px)" }}>
        <main style={{ width: 478, boxSizing: "border-box", padding: "30px 28px 30px 44px", flexShrink: 0 }}>
          <Summary cv={cv} color={color} />
          <Experience cv={cv} color={color} />
        </main>
        <aside style={{ flex: 1, boxSizing: "border-box", padding: "30px 40px 30px 28px", minWidth: 0 }}>
          <Education cv={cv} color={color} />
          <Lists cv={cv} color={color} />
        </aside>
      </div>
    </div>
  );
}

export function CVPage({ cv, template, color }: Props) {
  if (template === "classic") return <Classic cv={cv} color={color} />;
  if (template === "banner") return <Banner cv={cv} color={color} />;
  return <Modern cv={cv} color={color} />;
}
