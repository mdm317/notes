import type { Metadata } from 'next'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Footer, Layout, Navbar, ThemeSwitch } from 'nextra-theme-blog'
import 'nextra-theme-blog/style.css'

export const metadata: Metadata = {
  title: {
    default: '윤조의 블로그',
    template: '%s – 윤조의 블로그'
  },
  description: 'Obsidian에서 작성한 기록을 공유합니다.'
}

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <Head />
      <body>
        <Layout>
          <Navbar pageMap={await getPageMap()}>
            <ThemeSwitch />
          </Navbar>
          {children}
          <Footer>
            {new Date().getFullYear()} © 윤조
          </Footer>
        </Layout>
      </body>
    </html>
  )
}
