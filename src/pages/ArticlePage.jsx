import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TicketMenu from '../components/TicketMenu'
import FilmFooter from '../components/FilmFooter'
import StoryAccordion from '../components/StoryAccordion'
import ArticleHoverList from '../components/ArticleHoverList'
import BackToInfoArrow, { ARTICLE_PAGE_ROOT_ID } from '../components/BackToInfoArrow'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'
import { optimizedImageUrl, srcSetFor } from '../lib/sanityImage'
import { sanityClient } from '../lib/sanityClient'
import { articleBySlugQuery, articlesQuery } from '../lib/queries'
import NotFoundPage from './NotFoundPage'

const RELATED_COUNT = 5

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [allArticles, setAllArticles] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (!article) {
    if (loading) return null
    return <NotFoundPage />
  }

  const related = allArticles.filter((a) => a.id !== article.id).slice(0, RELATED_COUNT)

  return (
    <div id={ARTICLE_PAGE_ROOT_ID} className="min-h-screen w-full bg-cream">
      <BackToInfoArrow />

      <div className="px-8 pt-24 pb-20 md:px-20 md:pt-32">
        {/* Title block — full width until a laptop-sized viewport, then
            capped so it never grows arbitrarily wide on huge monitors. */}
        <div className="mx-auto flex w-full max-w-360 flex-col items-center text-center">
          <h1 className="m-0 font-sans text-[13vw] leading-[0.95] font-medium tracking-[0.02em] text-ink uppercase sm:text-[64px] md:text-[80px]">
            {article.title}
          </h1>
          {article.subheading && (
            <h3 className="mt-4 max-w-2xl font-sans text-base font-normal tracking-[0.06em] text-ink uppercase md:text-xl">
              {article.subheading}
            </h3>
          )}

          {(article.author || article.date) && (
            <div className="mt-6 flex flex-col items-center gap-1">
              {article.author && (
                <span className="flex flex-row items-center gap-2 font-sans text-sm tracking-[0.1em] text-ink uppercase">
                  {article.authorIcon && (
                    <img
                      src={optimizedImageUrl(article.authorIcon, { width: 40 })}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  )}
                  Written by {article.author}
                </span>
              )}
              <span className="font-sans text-sm tracking-[0.1em] text-ink/70 uppercase">
                {formatDate(article.date)}
              </span>
            </div>
          )}
        </div>

        {/* Same image (article.previewImage) shown here as the article's
            "first look" that the Info list's hover preview and click
            transition use — keeps the expand-into-article transition
            landing on a matching image instead of revealing bare text. */}
        {article.previewImage && (
          <div className="mx-auto mt-10 w-full max-w-5xl md:mt-16">
            <img
              src={optimizedImageUrl(article.previewImage, { width: 1600 })}
              srcSet={srcSetFor(article.previewImage, [480, 768, 1200, 1600, 2200])}
              sizes="(min-width: 768px) 80vw, 100vw"
              alt=""
              draggable={false}
              className="aspect-4/3 w-full rounded-3xl object-cover"
            />
          </div>
        )}

        {article.storySections?.length > 0 && (
          <div
            className={`mt-16 md:mt-24 ${
              article.contentWidth === 'contained' ? 'mx-auto max-w-5xl' : 'w-full'
            }`}
          >
            <StoryAccordion sections={article.storySections} ratio={article.storyRatio} />
          </div>
        )}

        {related.length > 0 && (
          <div className="mx-auto mt-20 max-w-4xl md:mt-28">
            <ArticleHoverList articles={related} heading="MORE INFO" />
          </div>
        )}
      </div>

      <TicketMenu />
      <FilmFooter />
    </div>
  )
}
