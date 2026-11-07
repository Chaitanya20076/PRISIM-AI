import React from "react";
import { ArrowUpRight, Compass, MessageCircle, GraduationCap, Handshake } from "lucide-react";
import "./mentorship.css";

const steps = [
  { icon: MessageCircle, title: "Ask openly", text: "Bring your questions, roadblocks and half-formed ideas." },
  { icon: Compass, title: "Find direction", text: "Get thoughtful guidance on what to explore next." },
  { icon: Handshake, title: "Move forward", text: "Learn alongside peers and experienced mentors." },
];

export default function Mentorship() {
  return (
    <section className="mentorship-feature" id="feature-mentorship">
      <div className="mentorship-feature__top">
        <div><span className="feature-kicker">05 / GROW</span><h2>Guidance that<br /><em>moves you forward.</em></h2></div>
        <div className="mentorship-quote"><GraduationCap size={28}/><p>Progress gets easier when you don't have to figure everything out alone.</p><span>THE PRISM MINDSET</span></div>
      </div>
      <div className="mentorship-steps">{steps.map(({icon:Icon,title,text},i)=><article key={title}><span className="mentorship-step-index">0{i+1}</span><span className="mentorship-step-icon"><Icon size={22}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      <a className="feature-inline-link" href="/events">Meet the community <ArrowUpRight size={16}/></a>
    </section>
  );
}