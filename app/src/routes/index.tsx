import { createFileRoute } from "@tanstack/react-router";
import { AtelierDepth } from "@/components/atelier-depth";
import { ScrollScrub } from "@/components/scroll-scrub/scroll-scrub";
import { scrollScrubScenes, scrollScrubTheme } from "@/scroll-scrub-scenes";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <main className="atelier-site">
      <nav className="atelier-nav" aria-label="Primary navigation">
        <a className="atelier-brand" href="#top"><span className="brand-dot" />ATELIER DIMENSION</a>
        <div className="atelier-nav-links"><a href="#world">World</a><a href="#form">Form</a><a href="#contact">Contact</a></div>
        <a className="nav-enter" href="#world"><span>Enter</span><b>↗</b></a>
      </nav>

      <section id="top" className="hero-stage">
        <AtelierDepth />
        <div className="hero-shade" />
        <div className="hero-topline"><span>FASHION STUDY / 2026</span><span>SCROLL TO ENTER</span></div>
        <div className="hero-title">
          <p>Atelier / 01</p>
          <h1>A little less <strong>hurry.</strong><br /><em>A little more form.</em></h1>
          <div className="hero-caption"><span>Measure</span><span>Shape</span><span>Detail</span></div>
        </div>
        <div className="hero-side">ATELIER<br />DIMENSION</div>
      </section>

      <section id="world" className="world-section">
        <div className="world-copy">
          <p className="section-index">01 / THE WORLD</p>
          <h2>The atelier begins with <em>measure.</em></h2>
          <p className="body-copy">A fashion study built from the objects that define the work: form, pattern, tape, proportion and the quiet space around them.</p>
          <a className="line-cta" href="#film">Enter the study <span>↗</span></a>
        </div>
        <div className="world-image" role="img" aria-label="Atelier Dimension garment composition" />
        <div className="world-measure"><span>36°</span><span>FORM / 01</span><span>01 / 04</span></div>
      </section>

      <section id="film" className="film-section" aria-label="Scroll controlled fashion film">
        <div className="film-heading"><span>02 / MOTION</span><strong>The camera is the tape.</strong></div>
        <ScrollScrub scenes={scrollScrubScenes} theme={scrollScrubTheme} />
      </section>

      <section id="form" className="form-section">
        <div className="form-heading">
          <p className="section-index">03 / FORM</p>
          <h2>Less interface.<br /><em>More material.</em></h2>
          <p className="body-copy">The garments carry the interface. The measuring tape becomes a line through the composition, and the details become the navigation.</p>
        </div>
        <div className="detail-stage">
          <div className="detail-video"><video className="detail-video-desktop" autoPlay loop muted playsInline preload="metadata" poster="/assets/world/atelier-detail-poster.png" src="/assets/world/atelier-detail.mp4" /><video className="detail-video-mobile" autoPlay loop muted playsInline preload="metadata" poster="/assets/world/atelier-detail-mobile-poster.png" src="/assets/world/atelier-detail-mobile.mp4" /></div>
          <div className="detail-label"><span>DETAIL / 03</span><span>GEOMETRY / TEXTILE / LINE</span></div>
          <div className="detail-orbit orbit-a" /><div className="detail-orbit orbit-b" />
        </div>
      </section>

      <section className="construction-section">
        <div className="construction-head"><p className="section-index">04 / CONSTRUCTION</p><h2>Pattern leaves the <em>signature.</em></h2></div>
        <div className="construction-grid">
          <article><div className="crop crop-burgundy" /><span>01</span><h3>Measure</h3><p>Proportion sets the frame.</p></article>
          <article><div className="crop crop-geometric" /><span>02</span><h3>Shape</h3><p>Structure becomes silhouette.</p></article>
          <article><div className="crop crop-tape" /><span>03</span><h3>Detail</h3><p>Pattern makes the signature.</p></article>
        </div>
      </section>

      <section className="signature-section">
        <div className="signature-image" />
        <div className="signature-overlay"><p>05 / SIGNATURE</p><h2>Take your time<br /><em>with the details.</em></h2><a className="signature-cta" href="#contact">Start a conversation <span>↗</span></a></div>
      </section>

      <footer id="contact" className="atelier-footer">
        <div><span className="brand-dot" />ATELIER DIMENSION</div><p>Independent fashion direction, tailoring and visual development.</p><span>2026</span>
      </footer>
    </main>
  );
}
