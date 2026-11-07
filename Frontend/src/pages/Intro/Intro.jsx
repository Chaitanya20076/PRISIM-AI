
import { useEffect, useRef, useState } from "react";
import {
  Volume2,
  VolumeX,
  SkipForward,
  Play,
} from "lucide-react";
import "./intro.css";

const INTRO_VIDEO = "/intro/prism-intro.mp4";
const EXIT_DURATION = 1200;

export default function Intro({ onComplete }) {
  const videoRef = useRef(null);
  const exitTimerRef = useRef(null);
  const exitingRef = useRef(false);

  const [exiting, setExiting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    async function startVideo() {
      video.muted = false;
      video.volume = 1;

      try {
        await video.play();

        if (!cancelled) {
          setSoundOn(true);
          setSoundBlocked(false);
        }
      } catch {
        // Browser blocked autoplay with sound.
        // Try muted autoplay, then let the visitor enable sound.
        if (cancelled) return;

        video.muted = true;

        try {
          await video.play();

          if (!cancelled) {
            setSoundOn(false);
            setSoundBlocked(true);
          }
        } catch (error) {
          console.error("Intro autoplay failed:", error);
          if (!cancelled) setSoundBlocked(true);
        }
      }
    }

    startVideo();

    return () => {
      cancelled = true;

      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  function finishIntro() {
    if (exitingRef.current) return;

    exitingRef.current = true;
    setExiting(true);

    exitTimerRef.current = window.setTimeout(() => {
      onComplete?.();
    }, EXIT_DURATION);
  }

  async function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    if (soundOn) {
      video.muted = true;
      setSoundOn(false);
      setSoundBlocked(false);
      return;
    }

    try {
      video.muted = false;
      video.volume = 1;
      await video.play();

      setSoundOn(true);
      setSoundBlocked(false);
    } catch (error) {
      console.error("Unable to enable intro audio:", error);
      video.muted = true;
      setSoundOn(false);
      setSoundBlocked(true);
    }
  }

  return (
    <section
      className={`prism-intro ${ready ? "is-ready" : ""} ${
        exiting ? "is-exiting" : ""
      }`}
      aria-label="PRISM AI cinematic introduction"
      aria-hidden={exiting}
    >
      {!videoError ? (
        <video
          ref={videoRef}
          className="prism-intro-video"
          src={INTRO_VIDEO}
          autoPlay
          muted={!soundOn}
          playsInline
          preload="auto"
          onCanPlay={() => setReady(true)}
          onEnded={finishIntro}
          onError={() => setVideoError(true)}
        />
      ) : (
        <div className="prism-intro-fallback">
          <h1>
            PRISM <span>AI</span>
          </h1>
          <p>Explore. Innovate. Impact.</p>
          <button type="button" onClick={finishIntro}>
            Enter website <SkipForward size={17} />
          </button>
        </div>
      )}

      {!videoError && (
        <>
          <div className="prism-intro-vignette" />

          <div className="prism-intro-controls">
            <button
              type="button"
              className={`prism-intro-control ${
                soundBlocked && !soundOn ? "sound-attention" : ""
              }`}
              onClick={toggleSound}
              aria-label={
                soundOn ? "Turn intro sound off" : "Turn intro sound on"
              }
              title={soundOn ? "Turn sound off" : "Turn sound on"}
            >
              {soundBlocked && !soundOn ? (
                <Play size={17} />
              ) : soundOn ? (
                <Volume2 size={17} />
              ) : (
                <VolumeX size={17} />
              )}

              <span>
                {soundBlocked && !soundOn
                  ? "Tap for sound"
                  : soundOn
                  ? "Sound on"
                  : "Sound off"}
              </span>
            </button>

            <button
              type="button"
              className="prism-intro-control prism-intro-skip"
              onClick={finishIntro}
              disabled={exiting}
            >
              <span>{exiting ? "Entering website..." : "Skip intro"}</span>
              <SkipForward size={17} />
            </button>
          </div>

          <div className="prism-intro-progress">
            <span />
          </div>
        </>
      )}
    </section>
  );
}
