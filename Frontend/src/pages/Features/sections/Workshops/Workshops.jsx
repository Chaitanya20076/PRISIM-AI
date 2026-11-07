import React from "react";
import { ArrowUpRight, Lightbulb, Code2, Users } from "lucide-react";
import "./workshops.css";

const points = [
  { icon: Lightbulb, title: "Start with the why", text: "Understand the idea before jumping into the tools." },
  { icon: Code2, title: "Learn by doing", text: "Turn concepts into small experiments and working demos." },
  { icon: Users, title: "Grow together", text: "Ask questions, share discoveries and learn as a team." },
];

export default function Workshops() {
  return (
    <section className="feature-row feature-row--workshops" id="feature-workshops">
      <div className="feature-copy">
        <span className="feature-kicker">01 / LEARN</span>
        <h2>Get hands-on.<br /><em>Get curious.</em></h2>
        <p className="feature-lead">Our workshops make emerging technology feel approachable. Explore a new tool, experiment with an idea and leave with something you can actually use.</p>
        <div className="feature-points">
          {points.map(({ icon: Icon, title, text }) => <div className="feature-point" key={title}><span className="feature-point-icon"><Icon size={18} /></span><div><h3>{title}</h3><p>{text}</p></div></div>)}
        </div>
        <a className="feature-inline-link" href="/events">Find a workshop <ArrowUpRight size={16} /></a>
      </div>
      <div className="feature-visual feature-visual--workshops">
        <img src="/images/features/feature-workshops.png" alt="Students collaborating during a hands-on technology workshop" />
        <div className="feature-image-caption"><span>LEARN TOGETHER</span><strong>Ideas become skills.</strong></div>
        <span className="feature-visual-index">01</span>
      </div>
    </section>
  );
}