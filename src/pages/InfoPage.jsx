import { useEffect, useState } from 'react'
import TicketMenu from '../components/TicketMenu'
import FilmFooter from '../components/FilmFooter'
import ArticleHoverList from '../components/ArticleHoverList'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'
import { sanityClient } from '../lib/sanityClient'
import { articlesQuery, infoPageQuery } from '../lib/queries'

export default function InfoPage() {
  const [infoPage, setInfoPage] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      sanityClient.fetch(infoPageQuery),
      sanityClient.fetch(articlesQuery),
    ]).then(([infoPageResult, articlesResult]) => {
      if (cancelled) return
      setInfoPage(infoPageResult || null)
      setArticles(articlesResult || [])
      setLoading(false)
    }, () => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const heading = infoPage?.heading || 'Web Info'
  const subheading = infoPage?.subheading || 'The only place you need for info about websites.'

  useDocumentHead({
    title: `${heading} | Latimer Studio`,
    description: subheading,
    path: '/info',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: heading,
      description: subheading,
      url: 'https://latimer.studio/info',
    },
  })

  useEffect(() => {
    const lenis = getLenis()
    if (lenis) {
      lenis.start()
      lenis.scrollTo(0, { immediate: true, force: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-cream">
      <div className="px-8 pt-24 pb-20 md:px-20 md:pt-32">
        {/* Title block — full width until a laptop-sized viewport, then
            capped so it never grows arbitrarily wide on huge monitors. */}
        <div className="mx-auto flex w-full max-w-360 flex-col items-center text-center">
          <h1 className="m-0 font-sans text-[13vw] leading-[0.95] font-medium tracking-[0.02em] text-ink uppercase sm:text-[64px] md:text-[80px]">
            {heading}
          </h1>
          <h3 className="mt-4 max-w-2xl font-sans text-base font-normal tracking-[0.06em] text-ink uppercase md:text-xl">
            {subheading}
          </h3>
        </div>

        <div className="mx-auto mt-16 max-w-4xl md:mt-24">
          {!loading && articles.length === 0 && (
            <p className="text-center font-sans text-ink/60 uppercase">
              No articles yet — check back soon.
            </p>
          )}
          <ArticleHoverList articles={articles} />
        </div>
      </div>

      <TicketMenu />
      <FilmFooter />
    </div>
  )
}
