import "./communityCTA.css";

function CommunityCTA() {
  return (
    <section className="prism-community-cta" id="community">
      <div className="community-cta-orbit orbit-one" aria-hidden="true" />
      <div className="community-cta-orbit orbit-two" aria-hidden="true" />
      <div className="community-cta-glow" aria-hidden="true" />
      <div className="community-cta-aurora community-cta-aurora-one" aria-hidden="true" />
      <div className="community-cta-aurora community-cta-aurora-two" aria-hidden="true" />
      <div className="community-cta-grid" aria-hidden="true" />
      <div className="community-cta-spark community-cta-spark-one" aria-hidden="true" />
      <div className="community-cta-spark community-cta-spark-two" aria-hidden="true" />
      <div className="community-cta-spark community-cta-spark-three" aria-hidden="true" />
      <div className="community-cta-crosshair crosshair-one" aria-hidden="true">+</div>
      <div className="community-cta-crosshair crosshair-two" aria-hidden="true">+</div>

      <div className="community-cta-inner">
        <div className="community-cta-label">
          <span className="community-status-dot" />
          THE NEXT IDEA COULD BE YOURS
        </div>

        <h2>
          Don't just watch
          <br />
          <span>the future happen.</span>
          <br />
          Help build it.
        </h2>

        <p className="community-cta-description">
          A space for curious minds, bold experiments, and people who want
          to make AI mean something. Bring your questions, your ideas, and
          your willingness to build.
        </p>

        <div className="community-cta-actions">
          <a href="/community" className="community-cta-primary">
            Be part of PRISM AI
            <span aria-hidden="true">↗</span>
          </a>

          <a href="/about" className="community-cta-secondary">
            Get to know us
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="community-cta-bottom">
          <span>EXPLORE WITH CURIOSITY</span>
          <span className="community-cta-divider" aria-hidden="true" />
          <span>BUILD WITH PURPOSE</span>
          <span className="community-cta-divider" aria-hidden="true" />
          <span>CREATE AN IMPACT</span>
        </div>
      </div>

      <div className="community-cta-coordinate coordinate-left" aria-hidden="true">
        P / 01
      </div>

      <div className="community-cta-coordinate coordinate-right" aria-hidden="true">
        AI / COMMUNITY
      </div>
    </section>
  );
}

export default CommunityCTA;
