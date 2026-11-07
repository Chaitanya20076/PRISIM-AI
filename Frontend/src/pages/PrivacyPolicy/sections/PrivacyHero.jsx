
import React from "react";
import {
  ArrowDown,
  ShieldCheck,
  Sparkles,
  LockKeyhole,
} from "lucide-react";

import "./privacy-hero.css";

const nodes = [
  [5, 18], [15, 9], [25, 23], [12, 38],
  [31, 8], [40, 20], [29, 44], [8, 68],
  [20, 81], [37, 73], [48, 91], [52, 11],
  [62, 28], [73, 12], [85, 22], [96, 9],
  [91, 45], [78, 58], [96, 77], [83, 89],
  [67, 82], [56, 65], [45, 51], [61, 49],
  [34, 93], [5, 94], [91, 65], [71, 95],
];

const connections = [
  [0, 1], [0, 3], [1, 2], [1, 4],
  [2, 3], [2, 5], [2, 6], [4, 5],
  [5, 6], [5, 11], [6, 9], [7, 8],
  [7, 3], [8, 9], [8, 25], [9, 10],
  [9, 22], [10, 21], [11, 12], [11, 13],
  [12, 13], [12, 23], [13, 14], [13, 15],
  [14, 15], [14, 16], [14, 17], [16, 17],
  [16, 26], [17, 23], [17, 19], [18, 19],
  [18, 26], [19, 20], [20, 21], [20, 27],
  [21, 22], [21, 23], [22, 23], [24, 10],
  [24, 25], [26, 18], [27, 20],
];

function PrivacyNetwork() {
  return (
    <div className="privacy-hero__network" aria-hidden="true">
      <svg
        className="privacy-hero__network-svg"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="privacyPulseGradient">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {connections.map(([from, to], index) => {
          const [x1, y1] = nodes[from];
          const [x2, y2] = nodes[to];

          return (
            <g key={index}>
              <line
                className="privacy-hero__network-line"
                x1={x1 * 10}
                y1={y1 * 6}
                x2={x2 * 10}
                y2={y2 * 6}
              />

              {index % 4 === 0 && (
                <line
                  className="privacy-hero__network-pulse"
                  x1={x1 * 10}
                  y1={y1 * 6}
                  x2={x2 * 10}
                  y2={y2 * 6}
                  pathLength="100"
                  style={{
                    animationDelay: `${(index % 9) * -1.3}s`,
                  }}
                />
              )}
            </g>
          );
        })}

        {nodes.map(([x, y], index) => (
          <circle
            key={index}
            className="privacy-hero__network-node"
            cx={x * 10}
            cy={y * 6}
            r={index % 5 === 0 ? 3.3 : 2.1}
            style={{
              animationDelay: `${(index % 8) * -0.8}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function PrivacyHero() {
  const scrollToContent = () => {
    document
      .querySelector(".privacy-content")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <section className="privacy-hero">
      <div className="privacy-hero__orb privacy-hero__orb--one" />
      <div className="privacy-hero__orb privacy-hero__orb--two" />

      <PrivacyNetwork />

      <div className="privacy-hero__inner">
        <div className="privacy-hero__eyebrow">
          <Sparkles size={14} />
          <span>PRISM AI · PRIVACY POLICY</span>
        </div>

        <div className="privacy-hero__visual">
          <div className="privacy-hero__halo privacy-hero__halo--outer" />
          <div className="privacy-hero__halo privacy-hero__halo--inner" />

          <div className="privacy-hero__icon">
            <ShieldCheck size={31} strokeWidth={1.4} />
          </div>

          <div className="privacy-hero__lock">
            <LockKeyhole size={13} />
          </div>
        </div>

        <h1>
          Privacy is
          <br />
          <span>personal.</span>
        </h1>

        <p>
          Your trust matters to us. Learn how PRISM AI approaches
          the collection, use and protection of information
          shared through our platform.
        </p>

        <div className="privacy-hero__meta">
          <span>Privacy Policy</span>
          <span className="privacy-hero__dot" />
          <span>Last updated: November 2026</span>
        </div>

        <button
          className="privacy-hero__scroll"
          onClick={scrollToContent}
        >
          Explore our privacy policy
          <ArrowDown size={16} />
        </button>
      </div>
    </section>
  );
}
