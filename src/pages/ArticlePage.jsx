import { useParams } from 'react-router-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import SiteNav from '../components/SiteNav'
import FilmFooter from '../components/FilmFooter'
import AboutSection from '../components/AboutSection'
import StoryAccordion from '../components/StoryAccordion'
import ArticleHoverList from '../components/ArticleHoverList'
import BackToInfoArrow, { ARTICLE_PAGE_ROOT_ID } from '../components/BackToInfoArrow'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'
import { optimizedImageUrl, srcSetFor } from '../lib/sanityImage'
import { sanityClient } from '../lib/sanityClient'
import { articleBySlugQuery, articlesQuery, homeQuery } from '../lib/queries'
import NotFoundPage from './NotFoundPage'

const RELATED_COUNT = 5

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "Oct 10th, 2026"
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  const day = d.getDate()
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] || 'th'
  return `${MONTHS[d.getMonth()]} ${day}${suffix}, ${d.getFullYear()}`
}

// Same ruled section label used by the About and FAQ sections.
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 text-ink/60 md:gap-5">
      <span className="h-0.5 w-8 bg-current md:w-15" />
      <h2 className="text-body m-0 uppercase">{children}</h2>
      <span className="h-0.5 flex-1 bg-current" />
    </div>
  )
}

export default function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [allArticles, setAllArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [home, setHome] = useState(null)
  const heroRef = useRef(null)
  const titleRef = useRef(null)

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

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      sanityClient.fetch(articleBySlugQuery, { slug }),
      sanityClient.fetch(articlesQuery),
    ]).then(([articleResult, articlesResult]) => {
      if (cancelled) return
      setArticle(articleResult || null)
      setAllArticles(articlesResult || [])
      setLoading(false)
    }, () => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    const lenis = getLenis()
    if (lenis) {
      lenis.start()
      lenis.scrollTo(0, { immediate: true, force: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [slug])

  useDocumentHead({
    title: article ? `${article.title} | Latimer Studio` : undefined,
    description: article?.excerpt || article?.subheading || undefined,
    path: article ? `/info/${article.id}` : undefined,
    ogType: 'article',
    image: article?.previewImage,
    jsonLd: article
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt || article.subheading,
          image: article.previewImage,
          datePublished: article.date,
          author: article.author ? { '@type': 'Person', name: article.author } : undefined,
          url: `https://latimer.studio/info/${article.id}`,
        }
      : undefined,
  })

  // Size the title to the widest it can be (max 128px) without wrapping, so
  // long titles shrink to fit the page instead of overflowing.
  const title = article?.title
  useLayoutEffect(() => {
    const hero = heroRef.current
    const el = titleRef.current
    if (!hero || !el) return
    const fit = () => {
      el.style.fontSize = '100px'
      const w = el.getBoundingClientRect().width
      if (w) el.style.fontSize = `${Math.min(128, (100 * hero.clientWidth) / w)}px`
    }
    fit()
    window.addEventListener('resize', fit)
    document.fonts?.ready.then(fit)
    return () => window.removeEventListener('resize', fit)
  }, [title])

  if (!article) {
    if (loading) return null
    return <NotFoundPage />
  }

  const related = allArticles.filter((a) => a.id !== article.id).slice(0, RELATED_COUNT)
  const overview = article.excerpt || article.subheading

  return (
    <div id={ARTICLE_PAGE_ROOT_ID} className="relative min-h-screen w-full bg-concrete">
      <BackToInfoArrow />

      <div className="flex h-dvh flex-col px-2 pt-28 pb-5 md:px-5 md:pt-32">
        <div ref={heroRef} className="mb-10 w-full shrink-0">
          <div className="mx-auto flex w-fit max-w-full flex-col items-center text-center">
            <h1
              ref={titleRef}
              className="m-0 whitespace-nowrap font-sans text-[128px] leading-[0.9] font-bold tracking-[-0.03em] text-ink uppercase"
            >
              {article.title}
            </h1>
          </div>
          {article.subheading && (
            <h3 className="text-h3 m-0 mt-4 text-center text-ink">{article.subheading}</h3>
          )}
          {(article.author || article.date) && (
            <div className="text-body mt-4 flex flex-row items-center justify-center gap-4 text-ink">
              {article.author && <span>{article.author}</span>}
              {article.date && <span>{formatDate(article.date)}</span>}
            </div>
          )}
        </div>

        {/* Same image (article.previewImage) the Info list's hover preview
            and click transition use, so the expand-into-article transition
            lands on a matching image. */}
        {article.previewImage && (
          <img
            src={optimizedImageUrl(article.previewImage, { width: 2200 })}
            srcSet={srcSetFor(article.previewImage, [768, 1200, 1600, 2200, 2800])}
            sizes="100vw"
            alt=""
            draggable={false}
            className="block min-h-0 w-full flex-1 rounded-2xl bg-ink object-cover"
          />
        )}
      </div>

      <section className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-5 md:py-20">
        <SectionLabel>Article Overview</SectionLabel>
        {overview && (
          <div className="mx-auto mt-10 max-w-[1000px] md:mt-16">
            <h3 className="text-h3 m-0 text-ink">{overview}</h3>
          </div>
        )}
      </section>

      {article.storySections?.length > 0 && (
        <div className="w-full px-5">
          <StoryAccordion sections={article.storySections} ratio={article.storyRatio} />
        </div>
      )}

      <section className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-5 md:py-20">
        <SectionLabel>Article Summary</SectionLabel>
        {overview && (
          <div className="mx-auto mt-10 max-w-[1000px] md:mt-16">
            <h3 className="text-h3 m-0 text-ink">{overview}</h3>
          </div>
        )}
        {related.length > 0 && (
          <div className="mt-10 md:mt-16">
            <ArticleHoverList articles={related} />
          </div>
        )}
      </section>

      <AboutSection about={home?.about} />
      <SiteNav />
      <FilmFooter />
    </div>
  )
}
