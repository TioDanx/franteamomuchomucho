import type { Metadata } from "next"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
})

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "Nuestros Planes",
  description: "Tu espacio compartido",
}

// Inline script to apply theme before first paint (avoids flash)
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (theme === 'light') {
        document.documentElement.classList.add('light');
      }
    } catch(e) {}
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-surface-container-high)",
              color: "var(--color-on-surface)",
              border: "1px solid color-mix(in srgb, var(--color-outline-variant) 30%, transparent)",
            },
          }}
        />
      </body>
    </html>
  )
}
