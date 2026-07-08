import "../styles/globals.css";

export const metadata = {
  title: "PCI Mock Interview — Prep & AI Feedback",
  description: "Practice UK PCI/credibility interview questions on video and get instant AI feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
