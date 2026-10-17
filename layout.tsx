import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobMatch AI: tailor your CV, practice interviews, find jobs",
  description: "Tailor your resume and cover letter to any job, build a CV with your photo, practice interviews and find recent jobs.",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "JobMatch AI" },
  applicationName: "JobMatch AI"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4f46e5"
};

// Sets the dark class before the first paint so the page does not flash the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
