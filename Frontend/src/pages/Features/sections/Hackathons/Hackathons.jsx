import React from "react";
import { ArrowUpRight, Trophy, Timer, UsersRound } from "lucide-react";
import "./hackathons.css";

const details = [
  { icon: Trophy, label: "Challenge yourself", text: "Take on real problems with bold, practical solutions." },
  { icon: Timer, label: "Build under pressure", text: "Move from a rough idea to a working prototype." },
  { icon: UsersRound, label: "Team up", text: "Collaborate with people who bring different strengths." },
];

export default function Hackathons() {
  return (
    <section className="feature-row feature-row--reverse feature-row--hackathons" id="feature-hackathons">
      <div className="feature-visual feature-visual--hackathons">
        <img src="/images/features/feature-hackathon.png" alt="Students working together during a coding hackathon" />
        <div className="hackathon-stamp"><span>THINK</span><b>BUILD</b><span>COMPETE</span></div>
        <div className="hackathon-photo-label">THE HACKATHON FLOOR · PRISM AI</div>
      </div>
      <div className="feature-copy">
        <span className="feature-kicker">02 / COMPETE</span>
        <h2>Big ideas.<br /><em>Short timelines.</em></h2>
        <p className="feature-lead">Hackathons turn curiosity into momentum. Work with a team, solve a meaningful challenge and experience the thrill of bringing an idea to life.</p>
        <div className="hackathon-details">{details.map(({icon: Icon,label,text})=><div className="hackathon-detail" key={label}><Icon size={19}/><div><h3>{label}</h3><p>{text}</p></div></div>)}</div>
        <a className="feature-inline-link" href="/events">Explore competitions <ArrowUpRight size={16}/></a>
      </div>
    </section>
  );
}