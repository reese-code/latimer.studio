import ProjectCard from './ProjectCard'
import { useSiteData } from '../hooks/useSiteData'

export default function ProjectsSection({ showHeading = true }) {
  const { projects } = useSiteData()
  if (!projects.length) return null

  return (
    <section className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-4 md:py-20">
      {/* Title row — short bar, label, then a bar filling the rest of the
          width. All at 60% of the dark (ink) color. */}
      {showHeading && (
        <div className="flex items-center gap-3 text-ink/60 md:gap-5">
          <span className="h-0.5 w-8 bg-current md:w-15" />
          <h2 className="text-body m-0 uppercase">Projects</h2>
          <span className="h-0.5 flex-1 bg-current" />
        </div>
      )}

      <div className={`${showHeading ? 'mt-10 ' : ''}flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-5`}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            className="aspect-square w-full rounded-2xl"
          />
        ))}
      </div>
    </section>
  )
}
