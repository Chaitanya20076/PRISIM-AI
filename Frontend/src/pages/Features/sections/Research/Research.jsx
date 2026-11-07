import React from "react";
import { ArrowUpRight, Microscope, BrainCircuit, FlaskConical, ScanSearch } from "lucide-react";
import "./research.css";

const themes = [
  { icon: BrainCircuit, title: "Artificial intelligence", text: "Explore intelligent systems and responsible AI." },
  { icon: ScanSearch, title: "Emerging technology", text: "Question what's possible with new tools." },
  { icon: FlaskConical, title: "Experimentation", text: "Test ideas, learn from evidence and iterate." },
];

export default function Research() {
  return (
    <section className="research-feature" id="feature-research">
      <div className="research-feature__header">
        <div><span className="feature-kicker">04 / DISCOVER</span><h2>Stay curious.<br /><em>Push boundaries.</em></h2></div>
        <p>Research starts with a question. We create room to investigate emerging ideas, explore unanswered problems and turn curiosity into meaningful discoveries.</p>
      </div>
      <div className="research-feature__body">
        <div className="research-orbit" aria-hidden="true">
          <span className="orbit-ring orbit-ring--one" /><span className="orbit-ring orbit-ring--two" />
          <span className="orbit-core"><Microscope size={42}/></span>
          <span className="orbit-node orbit-node--one"><BrainCircuit size={18}/></span>
          <span className="orbit-node orbit-node--two"><FlaskConical size={18}/></span>
          <span className="orbit-node orbit-node--three"><ScanSearch size={18}/></span>
        </div>
        <div className="research-topics">{themes.map(({icon:Icon,title,text},i)=><article key={title}><span className="research-topic-number">0{i+1}</span><Icon size={21}/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      </div>
      <a className="feature-inline-link" href="/events">Find your next learning opportunity <ArrowUpRight size={16}/></a>
    </section>
  );
}