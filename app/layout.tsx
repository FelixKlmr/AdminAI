// app/layout.tsx
export const metadata = {
  title: 'AdminAI — Exact Online × Claude',
  description: 'Automatisch inkoopfacturen verwerken',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  )
}
