import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Footer, Layout, Navbar, ThemeSwitch } from 'nextra-theme-blog'
import 'nextra-theme-blog/style.css'
import './blog.css'

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
