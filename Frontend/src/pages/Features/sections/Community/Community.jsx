import React from "react";
import { ArrowUpRight, HeartHandshake, MessagesSquare, Network, PartyPopper } from "lucide-react";
import "./community.css";

const communityValues = [
  { icon: MessagesSquare, title: "Share what you know", text: "Every perspective can teach someone something new." },
  { icon: Network, title: "Meet your people", text: "Find collaborators, friends and future teammates." },
  { icon: PartyPopper, title: "Celebrate progress", text: "Make room for milestones, events and small wins." },
];

export default function Community() {
  return (
    <section className="feature-row feature-row--reverse feature-row--community" id="feature-community">
      <div className="feature-visual feature-visual--community">
        <img src="/images/features/feature-community.png" alt="Students connecting and sharing ideas at a community gathering" />
        <div className="community-photo-note"><HeartHandshake size={19}/><span>BETTER, TOGETHER</span></div>
      </div>
      <div className="feature-copy">
        <span className="feature-kicker">06 / CONNECT</span>
        <h2>Find your people.<br /><em>Make things happen.</em></h2>
        <p className="feature-lead">PRISM is more than sessions and projects. It’s a community where people exchange ideas, support one another and make memorable things happen together.</p>
        <div className="community-values">{communityValues.map(({icon:Icon,title,text})=><div key={title}><Icon size={19}/><section><h3>{title}</h3><p>{text}</p></section></div>)}</div>
        <a className="feature-inline-link" href="/events">Be part of the next event <ArrowUpRight size={16}/></a>
      </div>
    </section>
  );
}