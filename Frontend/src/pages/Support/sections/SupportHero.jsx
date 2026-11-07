import React from "react";
import {
  ArrowDown,
  Headset,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import "./support-hero.css";

const PARTICLE_COUNT = 180;

const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];

const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
  const corner = corners[index % 4];
  const seed = index * 9301 + 49297;

  // Deterministic variation so particles don't all follow the same path.
  const random = (offset) => {
    const value = Math.sin(seed + offset * 127.1) * 43758.5453;
    return value - Math.floor(value);
  };

  const spreadX = random(1) * 25;
  const spreadY = random(2) * 34;

  let x = spreadX;
  let y = spreadY;
  let dx = 30 + random(3) * 20;
  let dy = 25 + random(4) * 20;

  if (corner === "top-right") {
    x = 75 + spreadX;
    dx = -(30 + random(3) * 20);
  }

  if (corner === "bottom-left") {
    y = 66 + spreadY;
    dy = -(25 + random(4) * 20);
  }

  if (corner === "bottom-right") {
    x = 75 + spreadX;
    y = 66 + spreadY;
    dx = -(30 + random(3) * 20);
    dy = -(25 + random(4) * 20);
  }

  return {
    id: index,
    corner,
    x,
    y,
    dx,
    dy,
    size: 2 + random(5) * 3.5,
    duration: 5 + random(6) * 5,
    delay: random(7) * -10,
    opacity: 0.55 + random(8) * 0.45,
    drift: (random(9) - 0.5) * 9,
  };
});

export default function SupportHero() {
  const scrollToForm = () => {
    document.getElementById("support-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="support-hero">
      {/* Background glow */}
      <div className="support-hero__orb support-hero__orb--one" />
      <div className="support-hero__orb support-hero__orb--two" />

      {/* Continuous particle streams */}
      <div className="support-hero__particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={`support-particle support-particle--${particle.corner}`}
            style={{
              "--particle-x": `${particle.x}%`,
              "--particle-y": `${particle.y}%`,
              "--particle-dx": `${particle.dx}vw`,
              "--particle-dy": `${particle.dy}vh`,
              "--particle-size": `${particle.size}px`,
              "--particle-duration": `${particle.duration}s`,
              "--particle-delay": `${particle.delay}s`,
              "--particle-opacity": particle.opacity,
              "--particle-drift": `${particle.drift}px`,
            }}
          />
        ))}
      </div>

      {/* Hero content */}
      <div className="support-hero__inner">
        <div className="support-hero__eyebrow">
          <Sparkles size={14} />
          <span>PRISM AI · SUPPORT CENTRE</span>
        </div>

        <div className="support-hero__visual">
          <div className="support-hero__visual-ring support-hero__visual-ring--one" />
          <div className="support-hero__visual-ring support-hero__visual-ring--two" />

          <div className="support-hero__icon">
            <Headset size={34} strokeWidth={1.4} />
          </div>

          <div className="support-hero__floating support-hero__floating--left">
            <MessageCircle size={17} />
          </div>

          <div className="support-hero__floating support-hero__floating--right">
            <Sparkles size={16} />
          </div>
        </div>

        <h1>
          We're here
          <br />
          <span>to help you.</span>
        </h1>

        <p>
          Have a question, facing an issue or looking to collaborate?
          Tell us what's on your mind. Let's figure it out together.
        </p>

        <button
          className="support-hero__button"
          onClick={scrollToForm}
        >
          Get in touch
          <ArrowDown size={16} />
        </button>

        <div className="support-hero__bottom">
          <span />
          <p>QUESTIONS · IDEAS · COLLABORATIONS</p>
          <span />
        </div>
      </div>
    </section>
  );
}