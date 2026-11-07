
import React, { useEffect, useState } from "react";

import {
  ShieldCheck,
  Database,
  UserRound,
  Cookie,
  LockKeyhole,
  Share2,
  Clock3,
  RefreshCw,
  Mail,
  Globe,
  Baby,
  Scale,
  ChevronRight,
  FileText,
} from "lucide-react";

import "./privacy-content.css";

const sections = [
  {
    id: "introduction",
    number: "01",
    title: "Introduction",
    icon: ShieldCheck,
    content: (
      <>
        <p>
          Welcome to PRISM AI, the Artificial Intelligence club
          at RNS Institute of Technology. We value the privacy
          of our visitors, students, members, participants and
          everyone who interacts with our website.
        </p>
        <p>
          This Privacy Policy explains what information may
          be collected, how it may be used, and the choices
          available to you when using our website and related
          services.
        </p>
      </>
    ),
  },
  {
    id: "information",
    number: "02",
    title: "Information We May Collect",
    icon: Database,
    content: (
      <>
        <p>
          Depending on the features you use, we may collect
          the following categories of information:
        </p>
        <ul>
          <li>
            <strong>Personal information:</strong> Name,
            email address, contact details and other information
            you voluntarily provide through forms.
          </li>
          <li>
            <strong>Academic or participation information:</strong>{" "}
            College, department, year of study, team details
            or event-related information where requested.
          </li>
          <li>
            <strong>Technical information:</strong> Browser
            type, device information, IP address and basic
            website interaction data, where applicable.
          </li>
          <li>
            <strong>Communication information:</strong> Messages,
            feedback, queries and information you send to us.
          </li>
        </ul>
        <p>
          We aim to request only information that is relevant
          to the purpose of the particular activity or service.
        </p>
      </>
    ),
  },
  {
    id: "usage",
    number: "03",
    title: "How We Use Your Information",
    icon: UserRound,
    content: (
      <>
        <p>
          Information provided to PRISM AI may be used for
          purposes such as:
        </p>
        <ul>
          <li>Managing event registrations and participation.</li>
          <li>Responding to questions and support requests.</li>
          <li>Sharing relevant club announcements and updates.</li>
          <li>Managing recruitment and membership enquiries.</li>
          <li>Improving website functionality and user experience.</li>
          <li>Maintaining the security and integrity of our services.</li>
        </ul>
        <p>
          We will not describe a use as active unless the
          corresponding feature or process is actually
          implemented.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    number: "04",
    title: "Cookies and Similar Technologies",
    icon: Cookie,
    content: (
      <>
        <p>
          The website may use cookies or similar technologies
          to support essential functionality, remember
          preferences or understand website usage.
        </p>
        <p>
          The use of analytics, advertising or non-essential
          tracking technologies should be disclosed here
          if such services are enabled.
        </p>
        <p>
          You can manage or disable cookies through your
          browser settings. Some website features may not
          work as intended if essential cookies are disabled.
        </p>
      </>
    ),
  },
  {
    id: "security",
    number: "05",
    title: "Data Security",
    icon: LockKeyhole,
    content: (
      <>
        <p>
          We take reasonable steps to protect information
          handled through the website against unauthorized
          access, alteration, disclosure or destruction.
        </p>
        <p>
          However, no online platform or electronic storage
          method can be guaranteed to be completely secure.
          Users should avoid submitting passwords or other
          sensitive information through general contact forms.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    number: "06",
    title: "Sharing of Information",
    icon: Share2,
    content: (
      <>
        <p>
          Personal information is not intended to be sold
          or rented. Information may be shared only where
          reasonably necessary for legitimate website or
          club activities, subject to applicable requirements.
        </p>
        <ul>
          <li>
            With authorized club or institutional personnel
            where required for an activity.
          </li>
          <li>
            With service providers supporting website
            functionality, if such providers are used.
          </li>
          <li>
            Where disclosure is required by applicable law
            or a valid legal request.
          </li>
        </ul>
        <p>
          Any third-party services actually used by the
          website should be identified in this policy.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    number: "07",
    title: "Data Retention",
    icon: Clock3,
    content: (
      <>
        <p>
          Information should be retained only for as long
          as it is reasonably required for the purpose for
          which it was collected, or as required by applicable
          institutional or legal obligations.
        </p>
        <p>
          Actual retention periods may differ depending on
          the type of information and the activity involved.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    number: "08",
    title: "Your Privacy Choices and Rights",
    icon: Scale,
    content: (
      <>
        <p>
          You may contact PRISM AI to ask about the personal
          information you have submitted or request correction
          of inaccurate information, where applicable.
        </p>
        <p>
          Depending on applicable law and the circumstances,
          you may also request deletion of information or
          raise concerns about how it is being handled.
        </p>
        <p>
          We may need to verify your identity before acting
          on certain requests.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    number: "09",
    title: "Third-Party Websites",
    icon: Globe,
    content: (
      <>
        <p>
          Our website may contain links to external websites,
          event platforms, registration forms or other
          third-party services.
        </p>
        <p>
          These websites operate under their own privacy
          policies and practices. PRISM AI is not responsible
          for the privacy practices or content of external
          platforms. We encourage you to review their policies
          before sharing information.
        </p>
      </>
    ),
  },
  {
    id: "children",
    number: "10",
    title: "Children's Privacy",
    icon: Baby,
    content: (
      <>
        <p>
          Our website and club activities are primarily
          intended for the college community and their
          participants.
        </p>
        <p>
          If we become aware that personal information has
          been submitted by a child in circumstances where
          appropriate consent is required, we will take
          reasonable steps to address the situation.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    number: "11",
    title: "Changes to This Policy",
    icon: RefreshCw,
    content: (
      <>
        <p>
          This Privacy Policy may be updated from time to
          time to reflect changes in our website, activities
          or applicable requirements.
        </p>
        <p>
          Any revised version will be published on this page.
          We encourage visitors to review this page periodically
          to stay informed.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    number: "12",
    title: "Contact Us",
    icon: Mail,
    content: (
      <>
        <p>
          If you have questions, concerns or requests relating
          to this Privacy Policy or the handling of your
          information, please contact the PRISM AI team through
          the official communication channel provided by
          the club or RNS Institute of Technology.
        </p>
        <p>
          Please avoid including passwords or other sensitive
          personal information in your message.
        </p>
      </>
    ),
  },
];

export default function PrivacyContent() {
  const [activeSection, setActiveSection] = useState("introduction");

  // Clicking a left-side item scrolls the normal webpage
  const navigateToSection = (id) => {
    const target = document.getElementById(id);

    if (!target) return;

    setActiveSection(id);

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Keep the left navigation in sync with normal page scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top -
              b.boundingClientRect.top
          );

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
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
    <section
      className="privacy-content"
      id="privacy-content"
    >
      <div className="privacy-content__layout">

        {/* LEFT SIDE — STICKY TABLE OF CONTENTS */}
        <aside className="privacy-content__sidebar">
          <div className="privacy-content__sidebar-inner">
            <div className="privacy-content__sidebar-heading">
              <FileText size={17} />
              <span>ON THIS PAGE</span>
            </div>

            <nav
              className="privacy-content__toc"
              aria-label="Privacy policy sections"
            >
              {sections.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  className={`privacy-content__toc-link ${
                    activeSection === section.id
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() => navigateToSection(section.id)}
                  aria-current={
                    activeSection === section.id
                      ? "location"
                      : undefined
                  }
                >
                  <span className="privacy-content__toc-number">
                    {section.number}
                  </span>

                  <span>{section.title}</span>

                  <ChevronRight
                    className="privacy-content__toc-arrow"
                    size={14}
                  />
                </button>
              ))}
            </nav>

            <div className="privacy-content__sidebar-note">
              <ShieldCheck size={18} />
              <p>
                Clear information.
                <br />
                Thoughtful protection.
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE — NORMAL PAGE CONTENT */}
        <div className="privacy-content__main">
          <div className="privacy-content__intro">
            <span className="privacy-content__eyebrow">
              THE DETAILS
            </span>

            <h2>
              Understanding how
              <span> your information works.</span>
            </h2>

            <p>
              Take a moment to understand the principles
              behind how information is collected, used
              and handled across our website.
            </p>
          </div>

          <div className="privacy-content__sections">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  className="privacy-content__section"
                  id={section.id}
                  key={section.id}
                >
                  <div className="privacy-content__section-heading">
                    <div className="privacy-content__section-icon">
                      <Icon size={19} strokeWidth={1.7} />
                    </div>

                    <span className="privacy-content__section-number">
                      {section.number}
                    </span>
                  </div>

                  <h3>{section.title}</h3>

                  <div className="privacy-content__section-body">
                    {section.content}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="privacy-content__closing">
            <div className="privacy-content__closing-icon">
              <ShieldCheck size={23} />
            </div>

            <div>
              <h3>Thank you for being part of PRISM AI.</h3>
              <p>
                Your trust helps us build a more transparent
                and responsible community.
              </p>
            </div>
          </div>

          <p className="privacy-content__footer-note">
            PRISM AI · RNS Institute of Technology
          </p>
        </div>
      </div>
    </section>
  );
}
