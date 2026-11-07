import React from "react";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

import "./support-resources.css";

const resources = [
  {
    number: "01",
    title: "Frequently Asked Questions",
    description:
      "Find quick answers about membership, events, workshops and more.",
    link: "/faqs",
    linkText: "Explore FAQs",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "Privacy Policy",
    description:
      "Understand how information submitted through our platform is handled.",
    link: "/privacy-policy",
    linkText: "Read privacy policy",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "Terms & Conditions",
    description:
      "Learn about the terms and responsibilities involved in using our platform.",
    link: "/terms-and-conditions",
    linkText: "Read the terms",
    icon: FileText,
  },
];

export default function SupportResources() {
  return (
    <section className="support-resources">
      <div className="support-resources__inner">
        <div className="support-resources__heading">
          <span>EXPLORE OUR RESOURCES</span>
          <h2>
            A little help
            <br />
            <em>goes a long way.</em>
          </h2>
          <p>
            Before reaching out, you might find exactly what you're
            looking for in one of these resources.
          </p>
        </div>

        <div className="support-resources__grid">
          {resources.map((resource) => {
            const Icon = resource.icon;

            return (
              <a
                className="support-resource"
                href={resource.link}
                key={resource.number}
              >
                <div className="support-resource__top">
                  <span>{resource.number}</span>
                  <div className="support-resource__icon">
                    <Icon size={21} strokeWidth={1.5} />
                  </div>
                </div>

                <h3>{resource.title}</h3>

                <p>{resource.description}</p>

                <div className="support-resource__link">
                  {resource.linkText}
                  <ArrowUpRight size={16} />
                </div>
              </a>
            );
          })}
        </div>

        <div className="support-resources__closing">
          <div className="support-resources__closing-icon">
            <MessageCircle size={21} />
          </div>

          <div>
            <h3>Still have something on your mind?</h3>
            <p>
              Use the support request form above and tell us how we can help.
            </p>
          </div>

          <a
            href="#support-form"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById("support-form")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            Write to us <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}