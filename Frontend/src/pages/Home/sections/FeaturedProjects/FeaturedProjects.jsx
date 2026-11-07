import "./featuredProjects.css";

const projectAreas = [
  {
    number: "01",
    category: "INTELLIGENT SYSTEMS",
    title: "Beyond the ordinary.",
    description:
      "Explore how AI agents and intelligent systems can reason, adapt, and solve meaningful problems.",
    tags: ["Agentic AI", "Generative AI"],
    accent: "terracotta",
    visual: "orbit",
    visualLabel: "THINK · ADAPT · ACT",
  },
  {
    number: "02",
    category: "PERCEPTION & LANGUAGE",
    title: "Teach machines to understand.",
    description:
      "Discover the intersection of computer vision, natural language processing, and multimodal intelligence.",
    tags: ["Computer Vision", "NLP"],
    accent: "rose",
    visual: "signal",
    visualLabel: "SEE · LEARN · UNDERSTAND",
  },
  {
    number: "03",
    category: "AI FOR IMPACT",
    title: "Build for the real world.",
    description:
      "Turn technical curiosity into practical solutions through experimentation, collaboration, and innovation.",
    tags: ["AI Automation", "Machine Learning"],
    accent: "ochre",
    visual: "impact",
    visualLabel: "IDEA → EXPERIMENT → IMPACT",
  },
];

function FeaturedProjects() {
  return (
    <section className="prism-projects-preview" id="project-preview">
      <div className="projects-preview-atmosphere" aria-hidden="true">
        <span className="projects-aurora projects-aurora-one" />
        <span className="projects-aurora projects-aurora-two" />
        <span className="projects-orbit projects-orbit-one" />
        <span className="projects-orbit projects-orbit-two" />
        <span className="projects-particle projects-particle-one" />
        <span className="projects-particle projects-particle-two" />
        <span className="projects-particle projects-particle-three" />
        <span className="projects-particle projects-particle-four" />
      </div>

      <div className="projects-preview-inner">
        <header className="projects-preview-heading">
          <div className="projects-preview-copy">
            <div className="projects-eyebrow">
              <span className="projects-eyebrow-dot" />
              IDEAS INTO INTELLIGENCE
            </div>

            <h2>
              Curiosity starts it.
              <br />
              <span>Creation takes it further.</span>
            </h2>

            <p>
              We explore emerging AI technologies, question what is possible,
              and turn ideas into solutions with purpose. Here is a glimpse
              into the world of possibilities that inspires PRISM AI.
            </p>
          </div>

          <div className="projects-preview-index" aria-hidden="true">
            <span className="projects-index-small">A LOOK INSIDE</span>
            <span className="projects-index-word">PRISM</span>
            <span className="projects-index-line" />
            <span className="projects-index-label">AI / LAB — 03</span>
          </div>
        </header>

        <div className="projects-preview-grid">
          {projectAreas.map((project) => (
            <article
              className={`project-preview-card project-${project.accent}`}
              key={project.number}
            >
              <div className="project-preview-top">
                <span className="project-preview-number">
                  <span className="project-number-dash" />
                  {project.number}
                </span>

                <span
                  className={`project-preview-art project-art-${project.visual}`}
                  aria-hidden="true"
                >
                  {project.visual === "orbit" && (
                    <>
                      <span className="orbit-ring orbit-ring-one" />
                      <span className="orbit-ring orbit-ring-two" />
                      <span className="orbit-ring orbit-ring-three" />
                      <span className="orbit-core" />
                    </>
                  )}

                  {project.visual === "signal" && (
                    <>
                      <span className="signal-line signal-line-one" />
                      <span className="signal-line signal-line-two" />
                      <span className="signal-line signal-line-three" />
                      <span className="signal-dot signal-dot-one" />
                      <span className="signal-dot signal-dot-two" />
                      <span className="signal-dot signal-dot-three" />
                    </>
                  )}

                  {project.visual === "impact" && (
                    <>
                      <span className="impact-square impact-square-one" />
                      <span className="impact-square impact-square-two" />
                      <span className="impact-square impact-square-three" />
                      <span className="impact-square impact-square-four" />
                      <span className="impact-center">+</span>
                    </>
                  )}
                </span>
              </div>

              <div className="project-preview-content">
                <span className="project-preview-category">
                  {project.category}
                </span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>

                <div className="project-preview-tags">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="project-preview-bottom">
                <span className="project-preview-visual-label">
                  {project.visualLabel}
                </span>
                <span className="project-preview-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
            </article>
          ))}
        </div>

        <footer className="projects-preview-footer">
          <div className="projects-footer-note">
            <span className="projects-footer-mark" aria-hidden="true">
              ✳
            </span>
            <p>
              Every breakthrough begins with a question worth exploring.
            </p>
          </div>

          <a href="/projects" className="projects-preview-link">
            <span>Discover our projects</span>
            <span className="projects-link-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </footer>
      </div>
    </section>
  );
}

export default FeaturedProjects;
