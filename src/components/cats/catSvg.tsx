/**
 * catSvg.tsx — SVG artwork for 3 cats across 6 poses each (18 total)
 *
 * getCatPoseSvg(catId, pose) returns inline SVG JSX (React.ReactNode)
 * Each SVG fits a 60x80 viewBox.
 *
 * Cat 1 — Mochi (mochi): rect-based pixel art, pink, bow
 * Cat 2 — Cosmo (cosmo): circle/ellipse/path smooth cartoon, blue, collar
 * Cat 3 — Luna (luna): path-based sleek cartoon, purple, no accessory
 *
 * Class names for CSS micro-animation targets (used in Plan 03):
 *   cat-body  → breathe (scaleY), walk-bob (translateY)
 *   cat-eyes  → blink (scaleY)
 *   cat-tail  → wag (rotate)
 *
 * Rules: NO <animate> or SMIL elements. Only g, rect, circle, ellipse, path.
 */

import type { CatState } from './catData';
import type React from 'react';

// ---------------------------------------------------------------------------
// Cat 1: Mochi — pixel art, pink (#FF9EC4), bow accessory
// Style: Pusheen-meets-pixel-art using <rect> with small rx
// ---------------------------------------------------------------------------

const MOCHI_PINK = '#FF9EC4';
const MOCHI_DARK = '#FF6FA8';
const MOCHI_BOW = '#FF3D8B';
const MOCHI_EYE = '#1a1a2e';

const mochiIdle = (
  <g className="cat-body">
    {/* Body */}
    <rect x="10" y="24" width="40" height="34" rx="4" fill={MOCHI_PINK} />
    {/* Left ear */}
    <rect x="13" y="8" width="12" height="18" rx="2" fill={MOCHI_PINK} />
    {/* Left ear inner */}
    <rect x="16" y="11" width="6" height="12" rx="1" fill={MOCHI_DARK} />
    {/* Right ear */}
    <rect x="35" y="8" width="12" height="18" rx="2" fill={MOCHI_PINK} />
    {/* Right ear inner */}
    <rect x="38" y="11" width="6" height="12" rx="1" fill={MOCHI_DARK} />
    {/* Head */}
    <rect x="10" y="16" width="40" height="26" rx="6" fill={MOCHI_PINK} />
    {/* Eyes */}
    <g className="cat-eyes">
      <rect x="17" y="22" width="8" height="8" rx="2" fill={MOCHI_EYE} />
      <rect x="35" y="22" width="8" height="8" rx="2" fill={MOCHI_EYE} />
      {/* Eye shine */}
      <rect x="19" y="23" width="2" height="2" rx="1" fill="white" />
      <rect x="37" y="23" width="2" height="2" rx="1" fill="white" />
    </g>
    {/* Nose */}
    <rect x="27" y="32" width="6" height="4" rx="2" fill={MOCHI_DARK} />
    {/* Legs */}
    <rect x="14" y="52" width="10" height="12" rx="3" fill={MOCHI_PINK} />
    <rect x="36" y="52" width="10" height="12" rx="3" fill={MOCHI_PINK} />
    {/* Tail */}
    <g className="cat-tail">
      <rect x="48" y="42" width="10" height="8" rx="4" fill={MOCHI_PINK} />
      <rect x="52" y="34" width="8" height="12" rx="4" fill={MOCHI_PINK} />
    </g>
    {/* Bow */}
    <rect x="11" y="10" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="18" y="10" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="15" y="11" width="4" height="4" rx="1" fill={MOCHI_BOW} />
  </g>
);

const mochiWalk = (
  <g className="cat-body">
    {/* Body — slight forward tilt */}
    <rect x="10" y="26" width="40" height="32" rx="4" fill={MOCHI_PINK} />
    {/* Left ear */}
    <rect x="13" y="10" width="12" height="18" rx="2" fill={MOCHI_PINK} />
    <rect x="16" y="13" width="6" height="12" rx="1" fill={MOCHI_DARK} />
    {/* Right ear */}
    <rect x="35" y="10" width="12" height="18" rx="2" fill={MOCHI_PINK} />
    <rect x="38" y="13" width="6" height="12" rx="1" fill={MOCHI_DARK} />
    {/* Head */}
    <rect x="10" y="18" width="40" height="26" rx="6" fill={MOCHI_PINK} />
    {/* Eyes */}
    <g className="cat-eyes">
      <rect x="17" y="24" width="8" height="8" rx="2" fill={MOCHI_EYE} />
      <rect x="35" y="24" width="8" height="8" rx="2" fill={MOCHI_EYE} />
      <rect x="19" y="25" width="2" height="2" rx="1" fill="white" />
      <rect x="37" y="25" width="2" height="2" rx="1" fill="white" />
    </g>
    <rect x="27" y="34" width="6" height="4" rx="2" fill={MOCHI_DARK} />
    {/* Legs offset — walking stride */}
    <rect x="12" y="52" width="10" height="12" rx="3" fill={MOCHI_PINK} />
    <rect x="26" y="56" width="10" height="10" rx="3" fill={MOCHI_PINK} />
    <rect x="40" y="52" width="10" height="12" rx="3" fill={MOCHI_PINK} />
    {/* Tail raised */}
    <g className="cat-tail">
      <rect x="50" y="36" width="8" height="10" rx="4" fill={MOCHI_PINK} />
      <rect x="53" y="26" width="6" height="14" rx="3" fill={MOCHI_PINK} />
    </g>
    {/* Bow */}
    <rect x="11" y="12" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="18" y="12" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="15" y="13" width="4" height="4" rx="1" fill={MOCHI_BOW} />
  </g>
);

const mochiSit = (
  <g className="cat-body">
    {/* Body — compact, legs tucked */}
    <rect x="8" y="38" width="44" height="32" rx="6" fill={MOCHI_PINK} />
    {/* Left ear */}
    <rect x="13" y="4" width="12" height="18" rx="2" fill={MOCHI_PINK} />
    <rect x="16" y="7" width="6" height="12" rx="1" fill={MOCHI_DARK} />
    {/* Right ear */}
    <rect x="35" y="4" width="12" height="18" rx="2" fill={MOCHI_PINK} />
    <rect x="38" y="7" width="6" height="12" rx="1" fill={MOCHI_DARK} />
    {/* Head */}
    <rect x="10" y="12" width="40" height="30" rx="6" fill={MOCHI_PINK} />
    {/* Eyes */}
    <g className="cat-eyes">
      <rect x="17" y="20" width="8" height="8" rx="2" fill={MOCHI_EYE} />
      <rect x="35" y="20" width="8" height="8" rx="2" fill={MOCHI_EYE} />
      <rect x="19" y="21" width="2" height="2" rx="1" fill="white" />
      <rect x="37" y="21" width="2" height="2" rx="1" fill="white" />
    </g>
    <rect x="27" y="30" width="6" height="4" rx="2" fill={MOCHI_DARK} />
    {/* Paws — tucked front paws */}
    <rect x="14" y="62" width="12" height="8" rx="4" fill={MOCHI_PINK} />
    <rect x="34" y="62" width="12" height="8" rx="4" fill={MOCHI_PINK} />
    {/* Tail wrapped around */}
    <g className="cat-tail">
      <rect x="2" y="54" width="8" height="10" rx="4" fill={MOCHI_PINK} />
      <rect x="4" y="62" width="16" height="8" rx="4" fill={MOCHI_PINK} />
    </g>
    {/* Bow */}
    <rect x="11" y="6" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="18" y="6" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="15" y="7" width="4" height="4" rx="1" fill={MOCHI_BOW} />
  </g>
);

const mochiSleep = (
  <g className="cat-body">
    {/* Body — curled, horizontal */}
    <rect x="4" y="40" width="52" height="28" rx="14" fill={MOCHI_PINK} />
    {/* Head drooped */}
    <rect x="6" y="28" width="34" height="26" rx="8" fill={MOCHI_PINK} />
    {/* Ears flat/small */}
    <rect x="10" y="20" width="10" height="12" rx="2" fill={MOCHI_PINK} />
    <rect x="12" y="22" width="6" height="8" rx="1" fill={MOCHI_DARK} />
    <rect x="26" y="20" width="10" height="12" rx="2" fill={MOCHI_PINK} />
    <rect x="28" y="22" width="6" height="8" rx="1" fill={MOCHI_DARK} />
    {/* Eyes closed — horizontal lines */}
    <g className="cat-eyes">
      <rect x="13" y="32" width="8" height="3" rx="1" fill={MOCHI_EYE} />
      <rect x="27" y="32" width="8" height="3" rx="1" fill={MOCHI_EYE} />
    </g>
    {/* Nose */}
    <rect x="21" y="37" width="6" height="4" rx="2" fill={MOCHI_DARK} />
    {/* Paws tucked under */}
    <rect x="10" y="54" width="14" height="8" rx="4" fill={MOCHI_PINK} />
    {/* Tail curled over body */}
    <g className="cat-tail">
      <rect x="48" y="38" width="10" height="8" rx="4" fill={MOCHI_PINK} />
      <rect x="44" y="46" width="12" height="8" rx="4" fill={MOCHI_PINK} />
    </g>
    {/* Bow */}
    <rect x="8" y="22" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="15" y="22" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="12" y="23" width="4" height="4" rx="1" fill={MOCHI_BOW} />
  </g>
);

const mochiJump = (
  <g className="cat-body">
    {/* Body — raised, arched */}
    <rect x="10" y="14" width="40" height="32" rx="4" fill={MOCHI_PINK} />
    {/* Left ear */}
    <rect x="12" y="0" width="12" height="16" rx="2" fill={MOCHI_PINK} />
    <rect x="15" y="2" width="6" height="10" rx="1" fill={MOCHI_DARK} />
    {/* Right ear */}
    <rect x="36" y="0" width="12" height="16" rx="2" fill={MOCHI_PINK} />
    <rect x="39" y="2" width="6" height="10" rx="1" fill={MOCHI_DARK} />
    {/* Head */}
    <rect x="10" y="6" width="40" height="26" rx="6" fill={MOCHI_PINK} />
    {/* Eyes — wide */}
    <g className="cat-eyes">
      <rect x="16" y="12" width="10" height="10" rx="3" fill={MOCHI_EYE} />
      <rect x="34" y="12" width="10" height="10" rx="3" fill={MOCHI_EYE} />
      <rect x="18" y="13" width="3" height="3" rx="1" fill="white" />
      <rect x="36" y="13" width="3" height="3" rx="1" fill="white" />
    </g>
    <rect x="27" y="24" width="6" height="4" rx="2" fill={MOCHI_DARK} />
    {/* Legs extended downward */}
    <rect x="10" y="44" width="10" height="20" rx="3" fill={MOCHI_PINK} />
    <rect x="22" y="48" width="10" height="20" rx="3" fill={MOCHI_PINK} />
    <rect x="36" y="48" width="10" height="20" rx="3" fill={MOCHI_PINK} />
    {/* Tail up */}
    <g className="cat-tail">
      <rect x="50" y="20" width="8" height="12" rx="4" fill={MOCHI_PINK} />
      <rect x="54" y="10" width="6" height="14" rx="3" fill={MOCHI_PINK} />
    </g>
    {/* Bow */}
    <rect x="12" y="2" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="19" y="2" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="16" y="3" width="4" height="4" rx="1" fill={MOCHI_BOW} />
  </g>
);

const mochiSurprised = (
  <g className="cat-body">
    {/* Body — arched back */}
    <rect x="10" y="30" width="40" height="30" rx="4" fill={MOCHI_PINK} />
    {/* Left ear — perked up */}
    <rect x="11" y="6" width="14" height="20" rx="2" fill={MOCHI_PINK} />
    <rect x="14" y="9" width="8" height="14" rx="1" fill={MOCHI_DARK} />
    {/* Right ear — perked up */}
    <rect x="35" y="6" width="14" height="20" rx="2" fill={MOCHI_PINK} />
    <rect x="38" y="9" width="8" height="14" rx="1" fill={MOCHI_DARK} />
    {/* Head */}
    <rect x="9" y="14" width="42" height="28" rx="6" fill={MOCHI_PINK} />
    {/* Eyes — very wide, round */}
    <g className="cat-eyes">
      <rect x="14" y="18" width="14" height="14" rx="4" fill={MOCHI_EYE} />
      <rect x="32" y="18" width="14" height="14" rx="4" fill={MOCHI_EYE} />
      <rect x="17" y="20" width="4" height="4" rx="2" fill="white" />
      <rect x="35" y="20" width="4" height="4" rx="2" fill="white" />
    </g>
    {/* Open mouth */}
    <rect x="25" y="32" width="10" height="8" rx="3" fill={MOCHI_DARK} />
    {/* Legs */}
    <rect x="14" y="54" width="10" height="12" rx="3" fill={MOCHI_PINK} />
    <rect x="36" y="54" width="10" height="12" rx="3" fill={MOCHI_PINK} />
    {/* Tail puffed/raised */}
    <g className="cat-tail">
      <rect x="50" y="32" width="8" height="16" rx="4" fill={MOCHI_PINK} />
      <rect x="52" y="22" width="10" height="14" rx="4" fill={MOCHI_PINK} />
    </g>
    {/* Bow */}
    <rect x="12" y="8" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="19" y="8" width="6" height="4" rx="1" fill={MOCHI_BOW} />
    <rect x="16" y="9" width="4" height="4" rx="1" fill={MOCHI_BOW} />
  </g>
);

// ---------------------------------------------------------------------------
// Cat 2: Cosmo — cartoon, blue (#7EC8E3), collar accessory
// Style: smooth cartoon with circle/ellipse/path, big expressive eyes
// ---------------------------------------------------------------------------

const COSMO_BLUE = '#7EC8E3';
const COSMO_DARK = '#4AABCC';
const COSMO_COLLAR = '#FF6B6B';
const COSMO_EYE = '#1a3a4a';
const COSMO_EYE_GREEN = '#5CC878';

const cosmoIdle = (
  <g className="cat-body">
    {/* Body */}
    <ellipse cx="30" cy="52" rx="22" ry="20" fill={COSMO_BLUE} />
    {/* Left ear */}
    <ellipse cx="16" cy="14" rx="8" ry="11" fill={COSMO_BLUE} />
    <ellipse cx="16" cy="15" rx="5" ry="8" fill={COSMO_DARK} />
    {/* Right ear */}
    <ellipse cx="44" cy="14" rx="8" ry="11" fill={COSMO_BLUE} />
    <ellipse cx="44" cy="15" rx="5" ry="8" fill={COSMO_DARK} />
    {/* Head */}
    <circle cx="30" cy="26" r="20" fill={COSMO_BLUE} />
    {/* Eyes */}
    <g className="cat-eyes">
      <circle cx="22" cy="23" r="7" fill={COSMO_EYE} />
      <circle cx="38" cy="23" r="7" fill={COSMO_EYE} />
      <circle cx="22" cy="23" r="4" fill={COSMO_EYE_GREEN} />
      <circle cx="38" cy="23" r="4" fill={COSMO_EYE_GREEN} />
      <circle cx="24" cy="21" r="2" fill="white" />
      <circle cx="40" cy="21" r="2" fill="white" />
    </g>
    {/* Nose */}
    <ellipse cx="30" cy="33" rx="3" ry="2" fill={COSMO_DARK} />
    {/* Mouth */}
    <path d="M27 36 Q30 40 33 36" stroke={COSMO_DARK} strokeWidth="1.5" fill="none" />
    {/* Collar */}
    <rect x="18" y="42" width="24" height="5" rx="2" fill={COSMO_COLLAR} />
    <circle cx="30" cy="47" r="3" fill="#FFD700" />
    {/* Tail */}
    <g className="cat-tail">
      <path d="M52 52 Q62 46 60 34 Q58 26 52 30" stroke={COSMO_BLUE} strokeWidth="7" fill="none" strokeLinecap="round" />
    </g>
    {/* Paws */}
    <ellipse cx="22" cy="68" rx="8" ry="5" fill={COSMO_BLUE} />
    <ellipse cx="38" cy="68" rx="8" ry="5" fill={COSMO_BLUE} />
  </g>
);

const cosmoWalk = (
  <g className="cat-body">
    {/* Body — slight forward lean */}
    <ellipse cx="30" cy="50" rx="22" ry="18" fill={COSMO_BLUE} />
    {/* Left ear */}
    <ellipse cx="16" cy="12" rx="8" ry="11" fill={COSMO_BLUE} />
    <ellipse cx="16" cy="13" rx="5" ry="8" fill={COSMO_DARK} />
    {/* Right ear */}
    <ellipse cx="44" cy="12" rx="8" ry="11" fill={COSMO_BLUE} />
    <ellipse cx="44" cy="13" rx="5" ry="8" fill={COSMO_DARK} />
    {/* Head — slightly forward */}
    <circle cx="30" cy="24" r="20" fill={COSMO_BLUE} />
    {/* Eyes */}
    <g className="cat-eyes">
      <circle cx="22" cy="21" r="7" fill={COSMO_EYE} />
      <circle cx="38" cy="21" r="7" fill={COSMO_EYE} />
      <circle cx="22" cy="21" r="4" fill={COSMO_EYE_GREEN} />
      <circle cx="38" cy="21" r="4" fill={COSMO_EYE_GREEN} />
      <circle cx="24" cy="19" r="2" fill="white" />
      <circle cx="40" cy="19" r="2" fill="white" />
    </g>
    <ellipse cx="30" cy="31" rx="3" ry="2" fill={COSMO_DARK} />
    <path d="M27 34 Q30 38 33 34" stroke={COSMO_DARK} strokeWidth="1.5" fill="none" />
    {/* Collar */}
    <rect x="18" y="40" width="24" height="5" rx="2" fill={COSMO_COLLAR} />
    <circle cx="30" cy="45" r="3" fill="#FFD700" />
    {/* Legs in stride */}
    <ellipse cx="18" cy="66" rx="7" ry="5" fill={COSMO_BLUE} />
    <ellipse cx="30" cy="70" rx="7" ry="5" fill={COSMO_BLUE} />
    <ellipse cx="42" cy="66" rx="7" ry="5" fill={COSMO_BLUE} />
    {/* Tail up */}
    <g className="cat-tail">
      <path d="M52 48 Q64 38 60 24 Q58 16 50 20" stroke={COSMO_BLUE} strokeWidth="7" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const cosmoSit = (
  <g className="cat-body">
    {/* Body — upright sitting */}
    <ellipse cx="30" cy="58" rx="20" ry="16" fill={COSMO_BLUE} />
    {/* Left ear */}
    <ellipse cx="16" cy="8" rx="8" ry="11" fill={COSMO_BLUE} />
    <ellipse cx="16" cy="9" rx="5" ry="8" fill={COSMO_DARK} />
    {/* Right ear */}
    <ellipse cx="44" cy="8" rx="8" ry="11" fill={COSMO_BLUE} />
    <ellipse cx="44" cy="9" rx="5" ry="8" fill={COSMO_DARK} />
    {/* Head */}
    <circle cx="30" cy="22" r="20" fill={COSMO_BLUE} />
    {/* Eyes */}
    <g className="cat-eyes">
      <circle cx="22" cy="19" r="7" fill={COSMO_EYE} />
      <circle cx="38" cy="19" r="7" fill={COSMO_EYE} />
      <circle cx="22" cy="19" r="4" fill={COSMO_EYE_GREEN} />
      <circle cx="38" cy="19" r="4" fill={COSMO_EYE_GREEN} />
      <circle cx="24" cy="17" r="2" fill="white" />
      <circle cx="40" cy="17" r="2" fill="white" />
    </g>
    <ellipse cx="30" cy="29" rx="3" ry="2" fill={COSMO_DARK} />
    <path d="M27 32 Q30 36 33 32" stroke={COSMO_DARK} strokeWidth="1.5" fill="none" />
    {/* Collar */}
    <rect x="18" y="38" width="24" height="5" rx="2" fill={COSMO_COLLAR} />
    <circle cx="30" cy="43" r="3" fill="#FFD700" />
    {/* Paws on floor */}
    <ellipse cx="22" cy="68" rx="9" ry="6" fill={COSMO_BLUE} />
    <ellipse cx="38" cy="68" rx="9" ry="6" fill={COSMO_BLUE} />
    {/* Tail wrapped */}
    <g className="cat-tail">
      <path d="M10 58 Q4 68 14 72 Q24 76 30 72" stroke={COSMO_BLUE} strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const cosmoSleep = (
  <g className="cat-body">
    {/* Body — on side */}
    <ellipse cx="32" cy="56" rx="26" ry="16" fill={COSMO_BLUE} />
    {/* Head down */}
    <circle cx="14" cy="44" r="16" fill={COSMO_BLUE} />
    {/* Ears flat */}
    <ellipse cx="6" cy="30" rx="6" ry="9" fill={COSMO_BLUE} />
    <ellipse cx="6" cy="31" rx="4" ry="6" fill={COSMO_DARK} />
    <ellipse cx="20" cy="28" rx="6" ry="9" fill={COSMO_BLUE} />
    <ellipse cx="20" cy="29" rx="4" ry="6" fill={COSMO_DARK} />
    {/* Eyes closed */}
    <g className="cat-eyes">
      <path d="M8 43 Q14 47 20 43" stroke={COSMO_EYE} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    {/* Nose */}
    <ellipse cx="14" cy="49" rx="2.5" ry="2" fill={COSMO_DARK} />
    {/* Collar */}
    <path d="M6 56 Q14 52 22 56" stroke={COSMO_COLLAR} strokeWidth="4" fill="none" strokeLinecap="round" />
    {/* Paws extended */}
    <ellipse cx="46" cy="62" rx="9" ry="5" fill={COSMO_BLUE} />
    <ellipse cx="56" cy="68" rx="6" ry="4" fill={COSMO_BLUE} />
    {/* Tail curled */}
    <g className="cat-tail">
      <path d="M58 56 Q64 48 58 44 Q52 40 48 46" stroke={COSMO_BLUE} strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const cosmoJump = (
  <g className="cat-body">
    {/* Body — stretched upward */}
    <ellipse cx="30" cy="44" rx="18" ry="22" fill={COSMO_BLUE} />
    {/* Left ear */}
    <ellipse cx="16" cy="6" rx="8" ry="11" fill={COSMO_BLUE} />
    <ellipse cx="16" cy="7" rx="5" ry="8" fill={COSMO_DARK} />
    {/* Right ear */}
    <ellipse cx="44" cy="6" rx="8" ry="11" fill={COSMO_BLUE} />
    <ellipse cx="44" cy="7" rx="5" ry="8" fill={COSMO_DARK} />
    {/* Head */}
    <circle cx="30" cy="20" r="20" fill={COSMO_BLUE} />
    {/* Eyes wide */}
    <g className="cat-eyes">
      <circle cx="22" cy="17" r="8" fill={COSMO_EYE} />
      <circle cx="38" cy="17" r="8" fill={COSMO_EYE} />
      <circle cx="22" cy="17" r="5" fill={COSMO_EYE_GREEN} />
      <circle cx="38" cy="17" r="5" fill={COSMO_EYE_GREEN} />
      <circle cx="25" cy="14" r="2.5" fill="white" />
      <circle cx="41" cy="14" r="2.5" fill="white" />
    </g>
    <ellipse cx="30" cy="28" rx="3" ry="2" fill={COSMO_DARK} />
    {/* Collar */}
    <rect x="18" y="36" width="24" height="5" rx="2" fill={COSMO_COLLAR} />
    <circle cx="30" cy="41" r="3" fill="#FFD700" />
    {/* Legs extended */}
    <ellipse cx="18" cy="68" rx="7" ry="6" fill={COSMO_BLUE} />
    <ellipse cx="42" cy="68" rx="7" ry="6" fill={COSMO_BLUE} />
    {/* Tail streaming back */}
    <g className="cat-tail">
      <path d="M48 50 Q58 44 58 34 Q58 26 52 28" stroke={COSMO_BLUE} strokeWidth="7" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const cosmoSurprised = (
  <g className="cat-body">
    {/* Body — puffed */}
    <ellipse cx="30" cy="52" rx="24" ry="22" fill={COSMO_BLUE} />
    {/* Left ear perked */}
    <ellipse cx="13" cy="10" rx="9" ry="13" fill={COSMO_BLUE} />
    <ellipse cx="13" cy="11" rx="6" ry="10" fill={COSMO_DARK} />
    {/* Right ear perked */}
    <ellipse cx="47" cy="10" rx="9" ry="13" fill={COSMO_BLUE} />
    <ellipse cx="47" cy="11" rx="6" ry="10" fill={COSMO_DARK} />
    {/* Head */}
    <circle cx="30" cy="26" r="22" fill={COSMO_BLUE} />
    {/* Eyes — huge and round */}
    <g className="cat-eyes">
      <circle cx="21" cy="22" r="10" fill={COSMO_EYE} />
      <circle cx="39" cy="22" r="10" fill={COSMO_EYE} />
      <circle cx="21" cy="22" r="6" fill={COSMO_EYE_GREEN} />
      <circle cx="39" cy="22" r="6" fill={COSMO_EYE_GREEN} />
      <circle cx="25" cy="18" r="3" fill="white" />
      <circle cx="43" cy="18" r="3" fill="white" />
    </g>
    {/* Open O mouth */}
    <ellipse cx="30" cy="36" rx="4" ry="5" fill={COSMO_DARK} />
    {/* Collar */}
    <rect x="17" y="44" width="26" height="5" rx="2" fill={COSMO_COLLAR} />
    <circle cx="30" cy="49" r="3" fill="#FFD700" />
    {/* Paws up */}
    <ellipse cx="12" cy="58" rx="7" ry="5" fill={COSMO_BLUE} />
    <ellipse cx="48" cy="58" rx="7" ry="5" fill={COSMO_BLUE} />
    {/* Tail puffed */}
    <g className="cat-tail">
      <path d="M54 56 Q68 46 64 30 Q60 18 52 24" stroke={COSMO_BLUE} strokeWidth="10" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

// ---------------------------------------------------------------------------
// Cat 3: Luna — cartoon, purple (#C9B1FF), no accessory
// Style: sleek/curious with path curves, bigger ears, expressive tail
// ---------------------------------------------------------------------------

const MISO_PURPLE = '#C9B1FF';
const MISO_DARK = '#A07AF5';
const MISO_EYE = '#2a1a4e';
const MISO_EYE_AMBER = '#F5A623';

const lunaIdle = (
  <g className="cat-body">
    {/* Body — slim */}
    <ellipse cx="30" cy="54" rx="18" ry="18" fill={MISO_PURPLE} />
    {/* Left ear — large, curious */}
    <path d="M10 20 L6 0 L20 14" fill={MISO_PURPLE} />
    <path d="M11 19 L7 3 L19 15" fill={MISO_DARK} />
    {/* Right ear — large */}
    <path d="M50 20 L54 0 L40 14" fill={MISO_PURPLE} />
    <path d="M49 19 L53 3 L41 15" fill={MISO_DARK} />
    {/* Head — slightly tilted */}
    <ellipse cx="30" cy="28" rx="19" ry="20" fill={MISO_PURPLE} />
    {/* Eyes — slightly different sizes, curious */}
    <g className="cat-eyes">
      <ellipse cx="22" cy="24" rx="7" ry="8" fill={MISO_EYE} />
      <ellipse cx="38" cy="25" rx="6" ry="7" fill={MISO_EYE} />
      <ellipse cx="22" cy="24" rx="4" ry="5" fill={MISO_EYE_AMBER} />
      <ellipse cx="38" cy="25" rx="3.5" ry="4.5" fill={MISO_EYE_AMBER} />
      <circle cx="24" cy="22" r="2" fill="white" />
      <circle cx="40" cy="23" r="2" fill="white" />
    </g>
    {/* Nose */}
    <ellipse cx="30" cy="34" rx="2.5" ry="2" fill={MISO_DARK} />
    {/* Mouth — slight smile */}
    <path d="M28 37 Q30 40 32 37" stroke={MISO_DARK} strokeWidth="1.5" fill="none" />
    {/* Long expressive tail */}
    <g className="cat-tail">
      <path d="M48 52 Q62 48 60 36 Q58 26 50 28 Q44 30 46 38" stroke={MISO_PURPLE} strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
    {/* Paws */}
    <ellipse cx="22" cy="68" rx="7" ry="5" fill={MISO_PURPLE} />
    <ellipse cx="38" cy="68" rx="7" ry="5" fill={MISO_PURPLE} />
  </g>
);

const lunaWalk = (
  <g className="cat-body">
    {/* Body — purposeful stride */}
    <ellipse cx="30" cy="52" rx="18" ry="17" fill={MISO_PURPLE} />
    {/* Left ear */}
    <path d="M10 18 L6 0 L20 12" fill={MISO_PURPLE} />
    <path d="M11 17 L7 2 L19 13" fill={MISO_DARK} />
    {/* Right ear */}
    <path d="M50 18 L54 0 L40 12" fill={MISO_PURPLE} />
    <path d="M49 17 L53 2 L41 13" fill={MISO_DARK} />
    {/* Head — forward-looking */}
    <ellipse cx="30" cy="26" rx="19" ry="20" fill={MISO_PURPLE} />
    {/* Eyes */}
    <g className="cat-eyes">
      <ellipse cx="22" cy="22" rx="7" ry="8" fill={MISO_EYE} />
      <ellipse cx="38" cy="22" rx="7" ry="8" fill={MISO_EYE} />
      <ellipse cx="22" cy="22" rx="4" ry="5" fill={MISO_EYE_AMBER} />
      <ellipse cx="38" cy="22" rx="4" ry="5" fill={MISO_EYE_AMBER} />
      <circle cx="24" cy="20" r="2" fill="white" />
      <circle cx="40" cy="20" r="2" fill="white" />
    </g>
    <ellipse cx="30" cy="32" rx="2.5" ry="2" fill={MISO_DARK} />
    <path d="M28 35 Q30 38 32 35" stroke={MISO_DARK} strokeWidth="1.5" fill="none" />
    {/* Legs in stride */}
    <ellipse cx="18" cy="66" rx="7" ry="5" fill={MISO_PURPLE} />
    <ellipse cx="30" cy="70" rx="7" ry="5" fill={MISO_PURPLE} />
    <ellipse cx="42" cy="66" rx="7" ry="5" fill={MISO_PURPLE} />
    {/* Tail streaming elegantly */}
    <g className="cat-tail">
      <path d="M48 50 Q62 42 62 30 Q62 20 54 20 Q48 20 48 28" stroke={MISO_PURPLE} strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const lunaSit = (
  <g className="cat-body">
    {/* Body — compact, sitting */}
    <ellipse cx="30" cy="60" rx="18" ry="16" fill={MISO_PURPLE} />
    {/* Left ear */}
    <path d="M10 14 L6 0 L20 10" fill={MISO_PURPLE} />
    <path d="M11 13 L7 2 L19 11" fill={MISO_DARK} />
    {/* Right ear */}
    <path d="M50 14 L54 0 L40 10" fill={MISO_PURPLE} />
    <path d="M49 13 L53 2 L41 11" fill={MISO_DARK} />
    {/* Head */}
    <ellipse cx="30" cy="22" rx="19" ry="20" fill={MISO_PURPLE} />
    {/* Eyes curious, looking sideways */}
    <g className="cat-eyes">
      <ellipse cx="22" cy="18" rx="7" ry="8" fill={MISO_EYE} />
      <ellipse cx="38" cy="19" rx="7" ry="8" fill={MISO_EYE} />
      <ellipse cx="24" cy="18" rx="4" ry="5" fill={MISO_EYE_AMBER} />
      <ellipse cx="40" cy="19" rx="4" ry="5" fill={MISO_EYE_AMBER} />
      <circle cx="26" cy="16" r="2" fill="white" />
      <circle cx="42" cy="17" r="2" fill="white" />
    </g>
    <ellipse cx="30" cy="30" rx="2.5" ry="2" fill={MISO_DARK} />
    <path d="M28 33 Q30 36 32 33" stroke={MISO_DARK} strokeWidth="1.5" fill="none" />
    {/* Paws on floor */}
    <ellipse cx="22" cy="70" rx="8" ry="5" fill={MISO_PURPLE} />
    <ellipse cx="38" cy="70" rx="8" ry="5" fill={MISO_PURPLE} />
    {/* Tail wrapped around — distinctive long tail */}
    <g className="cat-tail">
      <path d="M12 60 Q4 70 12 76 Q22 80 30 76 Q38 72 38 68" stroke={MISO_PURPLE} strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const lunaSleep = (
  <g className="cat-body">
    {/* Body curled tight */}
    <ellipse cx="32" cy="58" rx="24" ry="16" fill={MISO_PURPLE} />
    {/* Head */}
    <ellipse cx="14" cy="46" rx="15" ry="16" fill={MISO_PURPLE} />
    {/* Ears flat */}
    <path d="M4 28 L2 14 L14 24" fill={MISO_PURPLE} />
    <path d="M4.5 27 L3 16 L13 25" fill={MISO_DARK} />
    <path d="M22 26 L24 12 L14 22" fill={MISO_PURPLE} />
    <path d="M21.5 25 L23 14 L15 23" fill={MISO_DARK} />
    {/* Eyes closed — curved lines */}
    <g className="cat-eyes">
      <path d="M7 44 Q14 49 21 44" stroke={MISO_EYE} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    {/* Nose */}
    <ellipse cx="14" cy="52" rx="2" ry="1.5" fill={MISO_DARK} />
    {/* Paws tucked */}
    <ellipse cx="36" cy="62" rx="10" ry="5" fill={MISO_PURPLE} />
    {/* Long tail curled over */}
    <g className="cat-tail">
      <path d="M56 56 Q66 46 62 36 Q58 28 50 32 Q44 36 46 44 Q48 50 44 56" stroke={MISO_PURPLE} strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const lunaJump = (
  <g className="cat-body">
    {/* Body stretched */}
    <ellipse cx="30" cy="46" rx="16" ry="22" fill={MISO_PURPLE} />
    {/* Left ear — perked */}
    <path d="M10 16 L6 0 L20 12" fill={MISO_PURPLE} />
    <path d="M11 15 L7 2 L19 13" fill={MISO_DARK} />
    {/* Right ear — perked */}
    <path d="M50 16 L54 0 L40 12" fill={MISO_PURPLE} />
    <path d="M49 15 L53 2 L41 13" fill={MISO_DARK} />
    {/* Head */}
    <ellipse cx="30" cy="22" rx="19" ry="20" fill={MISO_PURPLE} />
    {/* Eyes wide with excitement */}
    <g className="cat-eyes">
      <ellipse cx="22" cy="18" rx="8" ry="9" fill={MISO_EYE} />
      <ellipse cx="38" cy="18" rx="8" ry="9" fill={MISO_EYE} />
      <ellipse cx="22" cy="18" rx="5" ry="6" fill={MISO_EYE_AMBER} />
      <ellipse cx="38" cy="18" rx="5" ry="6" fill={MISO_EYE_AMBER} />
      <circle cx="25" cy="15" r="2.5" fill="white" />
      <circle cx="41" cy="15" r="2.5" fill="white" />
    </g>
    <ellipse cx="30" cy="30" rx="2.5" ry="2" fill={MISO_DARK} />
    {/* Legs extended */}
    <ellipse cx="18" cy="70" rx="7" ry="6" fill={MISO_PURPLE} />
    <ellipse cx="42" cy="70" rx="7" ry="6" fill={MISO_PURPLE} />
    {/* Tail streaming elegantly behind */}
    <g className="cat-tail">
      <path d="M46 52 Q60 46 60 32 Q60 20 52 20 Q46 20 46 28 Q46 36 52 38" stroke={MISO_PURPLE} strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const lunaSurprised = (
  <g className="cat-body">
    {/* Body */}
    <ellipse cx="30" cy="54" rx="19" ry="19" fill={MISO_PURPLE} />
    {/* Left ear very perked, standing tall */}
    <path d="M8 18 L4 0 L18 12" fill={MISO_PURPLE} />
    <path d="M9 17 L5 2 L17 13" fill={MISO_DARK} />
    {/* Right ear */}
    <path d="M52 18 L56 0 L42 12" fill={MISO_PURPLE} />
    <path d="M51 17 L55 2 L43 13" fill={MISO_DARK} />
    {/* Head */}
    <ellipse cx="30" cy="28" rx="20" ry="22" fill={MISO_PURPLE} />
    {/* Eyes — huge round surprised */}
    <g className="cat-eyes">
      <circle cx="21" cy="24" r="10" fill={MISO_EYE} />
      <circle cx="39" cy="24" r="10" fill={MISO_EYE} />
      <circle cx="21" cy="24" r="6" fill={MISO_EYE_AMBER} />
      <circle cx="39" cy="24" r="6" fill={MISO_EYE_AMBER} />
      <circle cx="25" cy="20" r="3" fill="white" />
      <circle cx="43" cy="20" r="3" fill="white" />
    </g>
    {/* Open mouth */}
    <ellipse cx="30" cy="38" rx="4" ry="5" fill={MISO_DARK} />
    {/* Paws up in surprise */}
    <ellipse cx="12" cy="56" rx="6" ry="5" fill={MISO_PURPLE} />
    <ellipse cx="48" cy="56" rx="6" ry="5" fill={MISO_PURPLE} />
    {/* Tail puffed and curved high */}
    <g className="cat-tail">
      <path d="M50 54 Q66 44 64 26 Q62 14 52 18 Q46 22 48 32" stroke={MISO_PURPLE} strokeWidth="8" fill="none" strokeLinecap="round" />
    </g>
  </g>
);

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

type PoseSvgMap = Record<CatState, React.ReactNode>;

const MOCHI_POSES: PoseSvgMap = {
  idle: mochiIdle,
  walk: mochiWalk,
  sit: mochiSit,
  sleep: mochiSleep,
  jump: mochiJump,
  surprised: mochiSurprised,
};

const COSMO_POSES: PoseSvgMap = {
  idle: cosmoIdle,
  walk: cosmoWalk,
  sit: cosmoSit,
  sleep: cosmoSleep,
  jump: cosmoJump,
  surprised: cosmoSurprised,
};

const LUNA_POSES: PoseSvgMap = {
  idle: lunaIdle,
  walk: lunaWalk,
  sit: lunaSit,
  sleep: lunaSleep,
  jump: lunaJump,
  surprised: lunaSurprised,
};

const CAT_POSES: Record<string, PoseSvgMap> = {
  mochi: MOCHI_POSES,
  cosmo: COSMO_POSES,
  luna: LUNA_POSES,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns inline SVG JSX for the given cat and pose.
 * The SVG uses a 60×80 viewBox and is intended to be rendered at 60-80px.
 *
 * @param catId  - one of: 'mochi', 'cosmo', 'luna'
 * @param pose   - one of: 'idle', 'walk', 'sit', 'sleep', 'jump', 'surprised'
 */
export function getCatPoseSvg(catId: string, pose: CatState): React.ReactNode {
  const poses = CAT_POSES[catId];
  if (!poses) {
    return null;
  }
  const svgContent = poses[pose];
  return (
    <svg
      viewBox="0 0 60 80"
      xmlns="http://www.w3.org/2000/svg"
      width="60"
      height="80"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {svgContent}
    </svg>
  );
}
