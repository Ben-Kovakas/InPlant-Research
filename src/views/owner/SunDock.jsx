/* ----------------------------------------------------------------------------
   SunDock — play/pause + the sun-path slider (0..1000 → sunT 0..1). Clock time
   derived from sunT (6:00 + sunT*12h). Drives TwinCanvas lighting + the live
   ledger's instant-output line.
---------------------------------------------------------------------------- */

import React from "react";

function clockFromT(t) {
  const hf = 6 + t * 12; // 6:00 → 18:00
  let h = Math.floor(hf);
  const m = Math.round((hf - h) * 60);
  const ampm = h >= 12 ? "PM" : "AM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return { hm: `${hh}:${String(m).padStart(2, "0")}`, ampm };
}

const SunIcon = ({ rise }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M17 18a5 5 0 0 0-10 0" />
    <line x1="3" y1="18" x2="21" y2="18" />
    {rise ? (
      <>
        <line x1="12" y1="2" x2="12" y2="6" />
        <path d="M8 6l4-4 4 4" />
      </>
    ) : (
      <>
        <path d="M12 6V2" />
        <path d="M16 4l-4 4-4-4" />
      </>
    )}
  </svg>
);

export default function SunDock({ sunT, setSunT, playing, setPlaying }) {
  const { hm, ampm } = clockFromT(sunT);
  return (
    <section className="ow-panel ow-dock" aria-label="Sun path control">
      <div className="ow-dock-top">
        <button
          className="ow-play"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause sun animation" : "Play sun animation"}
          aria-pressed={playing}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
              <rect x="3" y="2" width="3" height="10" />
              <rect x="8" y="2" width="3" height="10" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5l9 5.5-9 5.5z" />
            </svg>
          )}
        </button>
        <div className="ow-dock-lbl">
          <div className="l1">Sun path</div>
          <div className="l2">June 21 · summer solstice · 33.8°N</div>
        </div>
        <div className="ow-clock">
          <span className="t">{hm}</span>
          <span className="ap">{ampm}</span>
        </div>
      </div>
      <div className="ow-track">
        <span className="ico" title="Sunrise"><SunIcon rise /></span>
        <input
          type="range"
          min="0"
          max="1000"
          value={Math.round(sunT * 1000)}
          onChange={(e) => {
            if (playing) setPlaying(false);
            setSunT(Number(e.target.value) / 1000);
          }}
          aria-label="Time of day"
        />
        <span className="ico" title="Sunset"><SunIcon /></span>
      </div>
    </section>
  );
}
