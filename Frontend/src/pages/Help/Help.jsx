import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Sparkles, MessageCircle, Clock3 } from "lucide-react";
import "./Help.css";

export default function Help() {
  return (
    <main className="prism-help-page">
      <header className="prism-help-nav">
        <Link to="/dashboard" className="prism-help-brand"><span><Sparkles size={20} /></span><b>PRISM AI</b></Link>
        <Link to="/dashboard" className="prism-help-back"><ArrowLeft size={16} /> Back to Dashboard</Link>
      </header>
      <section className="prism-help-hero">
        <span className="prism-help-eyebrow"><MessageCircle size={14} /> WE'RE HERE TO HELP</span>
        <h1>How can we <em>help you?</em></h1>
        <p>Have a question, found an issue, or need assistance with your PRISM AI account? Reach out to our team. We'll be happy to help.</p>
      </section>
      <section className="prism-help-content">
        <div className="prism-help-heading"><span>GET IN TOUCH</span><h2>Contact the PRISM AI team</h2><p>Choose whichever contact method works best for you.</p></div>
        <div className="prism-help-contact-grid">
          <a className="prism-help-contact-card" href="mailto:help_prismai@gmail.com">
            <span className="prism-help-contact-icon"><Mail size={22} /></span>
            <small>EMAIL SUPPORT</small><h3>Send us an email</h3><p>For account questions, technical issues, feedback or general enquiries.</p>
            <strong>help_prismai@gmail.com</strong><span className="prism-help-open">Open email <ArrowLeft size={14} /></span>
          </a>
          <a className="prism-help-contact-card" href="tel:+917892405525">
            <span className="prism-help-contact-icon"><Phone size={22} /></span>
            <small>PHONE SUPPORT</small><h3>Give us a call</h3><p>Speak to the PRISM AI team for assistance and guidance.</p>
            <strong>+91 78924 05525</strong><span className="prism-help-open">Call support <ArrowLeft size={14} /></span>
          </a>
        </div>
        <div className="prism-help-note"><Clock3 size={17} /><span><b>A quick note</b><small>When contacting us, include a short description of the issue and the email address associated with your PRISM AI account. Please never share your password or verification codes.</small></span></div>
      </section>
      <footer className="prism-help-footer"><span><Sparkles size={14} /> PRISM AI · RNSIT</span><span>Explore. Innovate. Impact.</span></footer>
    </main>
  );
}
