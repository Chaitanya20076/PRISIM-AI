import React, { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import "./terms-content.css";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: [
      "By accessing or using the PRISM AI website, services, events or community platforms, you agree to comply with these Terms and Conditions.",
      "If you do not agree with these terms, please refrain from using the platform. These terms apply to visitors, registered users, participants and members interacting with PRISM AI services.",
    ],
  },
  {
    id: "about",
    title: "About PRISM AI",
    content: [
      "PRISM AI is an artificial intelligence-focused student community associated with RNS Institute of Technology. The platform is intended to share information about the club, its activities, projects, workshops, events and learning opportunities.",
      "Information published on the website may be updated as club activities, initiatives and institutional requirements evolve.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility and User Responsibilities",
    content: [
      "Users are expected to provide accurate information wherever registration or participation details are requested.",
      "You agree not to misuse the website, submit misleading information, interfere with its functionality, attempt unauthorized access or use the platform for unlawful activities.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and Registration",
    content: [
      "Certain activities, registrations or services may require users to submit personal or contact information.",
      "You are responsible for ensuring that the information you provide is accurate and for maintaining the confidentiality of any account credentials issued to you.",
      "PRISM AI reserves the right to restrict access where misuse, suspicious activity or violations of applicable rules are identified.",
    ],
  },
  {
    id: "events",
    title: "Events and Participation",
    content: [
      "Event details, schedules, venues, eligibility criteria and participation requirements are published for informational purposes and may change when necessary.",
      "Registrations may be handled through external platforms. Any additional terms imposed by those platforms or event organizers will apply separately.",
      "Participants are expected to follow event guidelines, deadlines, institutional rules and instructions communicated by the organizers.",
    ],
  },
  {
    id: "projects",
    title: "Projects and Intellectual Property",
    content: [
      "Unless otherwise stated, the website's branding, visual design, written content and original materials are intended for PRISM AI's use and are protected by applicable intellectual property laws.",
      "Project ownership, authorship and licensing remain subject to the agreements and licenses established by the respective creators, contributors and collaborators.",
      "Users must not reproduce, distribute or commercially exploit protected website materials without appropriate permission.",
    ],
  },
  {
    id: "external",
    title: "Third-Party Links and Services",
    content: [
      "The website may contain links to external websites, registration portals, repositories or other third-party services.",
      "PRISM AI does not control these external platforms and is not responsible for their content, availability, security practices or terms of use. Users should review the applicable policies before using them.",
    ],
  },
  {
    id: "availability",
    title: "Website Availability and Changes",
    content: [
      "We aim to keep the website accessible and information reasonably current. However, uninterrupted availability, error-free operation or permanent availability of every feature cannot be guaranteed.",
      "Features, content and services may be modified, suspended or discontinued when required for maintenance, improvements or operational reasons.",
    ],
  },
  {
    id: "disclaimer",
    title: "Disclaimer and Limitation of Liability",
    content: [
      "Website content is provided for general informational and educational purposes. While reasonable efforts may be made to maintain accuracy, information may occasionally be incomplete or outdated.",
      "To the extent permitted by applicable law, PRISM AI is not liable for losses arising from reliance on website information, interruptions in access or the use of third-party platforms.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    content: [
      "The handling of information submitted through the website is described in our Privacy Policy.",
      "By using the platform, you acknowledge that you should review the Privacy Policy to understand how information may be collected and used.",
    ],
  },
  {
    id: "termination",
    title: "Suspension and Termination",
    content: [
      "Access to the website or specific services may be restricted where users violate these terms, misuse the platform or engage in conduct that affects the safety or operation of the community.",
    ],
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    content: [
      "These Terms and Conditions may be revised periodically. Updated versions will be published on this page with a revised update date.",
      "Continued use of the platform after changes are published indicates acceptance of the updated terms, to the extent permitted by applicable law.",
    ],
  },
  {
    id: "contact",
    title: "Contact and Questions",
    content: [
      "If you have questions about these Terms and Conditions, please contact the PRISM AI team through the official contact channels provided on the website.",
    ],
  },
];

export default function TermsContent() {
  const [activeSection, setActiveSection] = useState("acceptance");

  const navigateToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveSection(id);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visible.length) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-18% 0px -65% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="terms-content">
      <div className="terms-content__layout">
        <aside className="terms-content__sidebar">
          <div className="terms-content__sidebar-inner">
            <span className="terms-content__label">ON THIS PAGE</span>

            <nav className="terms-content__toc">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  className={`terms-content__toc-link ${
                    activeSection === section.id ? "active" : ""
                  }`}
                  onClick={() => navigateToSection(section.id)}
                >
                  <span className="terms-content__toc-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{section.title}</span>
                  <ChevronRight size={13} />
                </button>
              ))}
            </nav>

            <div className="terms-content__sidebar-note">
              <span>Need clarification?</span>
              <a href="/support">
                Contact our team <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </aside>

        <div className="terms-content__main">
          <div className="terms-content__intro">
            <span className="terms-content__eyebrow">
              YOUR GUIDE TO USING PRISM AI
            </span>
            <h2>Understanding our terms.</h2>
            <p>
              These terms outline the responsibilities and expectations
              associated with using our website and participating in our
              community.
            </p>
          </div>

          {sections.map((section, index) => (
            <article
              className="terms-content__section"
              id={section.id}
              key={section.id}
            >
              <div className="terms-content__section-heading">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{section.title}</h3>
              </div>

              {section.content.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </article>
          ))}

          <div className="terms-content__closing">
            <span>PRISM AI</span>
            <p>Explore. Innovate. Impact.</p>
          </div>
        </div>
      </div>
    </section>
  );
}