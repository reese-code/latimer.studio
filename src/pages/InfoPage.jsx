import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import SiteNav from '../components/SiteNav'
import AboutSection from '../components/AboutSection'
import FilmFooter from '../components/FilmFooter'
import ArticleHoverList from '../components/ArticleHoverList'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'
import { sanityClient } from '../lib/sanityClient'
import { articlesQuery, infoPageQuery, homeQuery } from '../lib/queries'

export default function InfoPage() {
  const [infoPage, setInfoPage] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [home, setHome] = useState(null)

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

  // About-the-Studio slides/label come from the homepage's Sanity content.
  useEffect(() => {
    let cancelled = false
    sanityClient.fetch(homeQuery).then(
      (res) => !cancelled && setHome(res || null),
      () => {}
    )
    return () => {
      cancelled = true
    }
  }, [])
  const about = home?.about

  const heroRef = useRef(null)
  const titleRef = useRef(null)

  const heading = infoPage?.heading || 'Web Info'
  const subheading = infoPage?.subheading || 'The only resource you need in order to build a successful website. Each article is researched to help improve conversions.'

  // Mobile: size the title so it spans the full width of the page.
  useLayoutEffect(() => {
    const hero = heroRef.current
    const title = titleRef.current
    if (!hero || !title) return
    const mq = window.matchMedia('(max-width: 767px)')
    const fit = () => {
      // Desktop keeps the fixed 128px; mobile fits the title to the page width.
      if (!mq.matches) {
        title.style.removeProperty('font-size')
        return
      }
      title.style.fontSize = '100px'
      const w = title.getBoundingClientRect().width
      if (w) title.style.fontSize = `${(100 * hero.clientWidth) / w}px`
    }
    fit()
    window.addEventListener('resize', fit)
    document.fonts?.ready.then(fit)
    return () => window.removeEventListener('resize', fit)
  }, [heading])

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
    <div className="min-h-screen w-full bg-concrete">
      <div className="px-2 pt-20 md:px-5 md:pt-24">
        {/* Hero — 80px above and below. The inline-flex wrapper shrinks to
            the title's width, and the w-0/min-w-full body copy wraps to it
            without stretching it. */}
        <div ref={heroRef} className="w-full py-20">
          <div className="mx-auto flex w-fit max-w-full flex-col items-center text-center">
            <h1
              ref={titleRef}
              className="m-0 whitespace-nowrap font-sans text-[128px] leading-[0.9] font-bold tracking-[-0.03em] text-ink uppercase"
            >
              {heading}
            </h1>
            <p className="text-body m-0 mt-4 w-0 min-w-full text-ink">{subheading}</p>
          </div>
        </div>

        <div className="mx-auto w-full pb-10 md:pb-20">
          {!loading && articles.length === 0 && (
            <p className="text-body text-center text-ink/60">
              No articles yet — check back soon.
            </p>
          )}
          <ArticleHoverList articles={articles} />
        </div>
      </div>

      <AboutSection about={about} />
      <SiteNav />
      <FilmFooter />
    </div>
  )
}
