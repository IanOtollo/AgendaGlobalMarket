"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* Illustrated scenes of tradespeople at work.
   Palette: the brand navy and yellow with their tints, neutral greys, and one natural skin tone for the figure.
   The worker has jointed arms (shoulder and elbow rotate separately) so each trade gets a believable motion. */
const C = { ink: "#0B1530", navy: "#101F42", mid: "#17294F", deep: "#1E3469", blue: "#3A5BA9", sky: "#5C7FC9", line: "#C5CAD3", pale: "#E7EAF0", yel: "#FFC105", yelD: "#D99F00", skin: "#9A6B4B", skinD: "#7E5439" };

const CSS = `
.aw-in{animation:aw-in .7s cubic-bezier(.16,1,.3,1) both}
@keyframes aw-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.aw-u{animation:aw-u var(--t,1s) ease-in-out infinite alternate;transform:rotate(var(--u0))}
@keyframes aw-u{from{transform:rotate(var(--u0))}to{transform:rotate(var(--u1))}}
.aw-f{animation:aw-f var(--t,1s) ease-in-out infinite alternate;transform:rotate(var(--f0))}
@keyframes aw-f{from{transform:rotate(var(--f0))}to{transform:rotate(var(--f1))}}
.aw-c{animation:aw-c var(--t,1s) ease-in-out infinite alternate;transform:rotate(var(--c0))}
@keyframes aw-c{from{transform:rotate(var(--c0))}to{transform:rotate(var(--c1))}}
.aw-breathe{animation:aw-breathe 2.6s ease-in-out infinite alternate}
@keyframes aw-breathe{from{transform:translateY(0)}to{transform:translateY(-2.5px)}}
.aw-nod{transform-origin:113px 132px;animation:aw-nod 1.8s ease-in-out infinite alternate}
@keyframes aw-nod{from{transform:rotate(-1.5deg)}to{transform:rotate(3deg)}}
.aw-row{animation:aw-row 7s ease-out infinite both}
@keyframes aw-row{0%{opacity:0;transform:translateY(-14px)}6%,90%{opacity:1;transform:none}100%{opacity:0}}
.aw-drip{animation:aw-drip 1.2s cubic-bezier(.5,0,1,.6) infinite}
@keyframes aw-drip{0%{opacity:0;transform:translateY(0)}12%{opacity:1}92%{opacity:1}100%{opacity:0;transform:translateY(var(--fall,70px))}}
.aw-ring{transform-box:fill-box;transform-origin:50% 50%;animation:aw-ring 1.2s ease-out infinite}
@keyframes aw-ring{0%{opacity:.7;transform:scale(.3)}100%{opacity:0;transform:scale(1.4)}}
.aw-dust{animation:aw-dust .9s ease-out infinite}
@keyframes aw-dust{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx,8px),var(--dy,50px))}}
.aw-spark{animation:aw-spark .42s steps(1,end) infinite}
@keyframes aw-spark{0%{opacity:1}35%{opacity:0}60%{opacity:.9}80%{opacity:0}}
.aw-glow{transform-box:fill-box;transform-origin:50% 50%;animation:aw-glow 2.4s ease-in-out infinite alternate}
@keyframes aw-glow{from{opacity:.55;transform:scale(.94)}to{opacity:1;transform:scale(1.06)}}
.aw-blink{animation:aw-blink 1.6s steps(1,end) infinite}
@keyframes aw-blink{0%{opacity:1}50%{opacity:.15}}
.aw-sway{transform-box:fill-box;transform-origin:50% 0;animation:aw-sway 3s ease-in-out infinite alternate}
@keyframes aw-sway{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}
.aw-turn{transform-box:fill-box;transform-origin:50% 50%;animation:aw-turn 3.4s linear infinite}
@keyframes aw-turn{to{transform:rotate(360deg)}}
.aw-patch{transform-box:fill-box;transform-origin:50% 100%;animation:aw-patch var(--t,2.2s) ease-in-out infinite alternate}
@keyframes aw-patch{from{transform:scaleY(.03)}to{transform:scaleY(1)}}
.aw-cloud{animation:aw-cloud 40s linear infinite alternate}
@keyframes aw-cloud{to{transform:translateX(60px)}}
.aw-fall{animation:aw-fall 1.8s ease-in infinite}
@keyframes aw-fall{0%{transform:translate(0,0) rotate(0)}70%{transform:translate(6px,0) rotate(0)}100%{transform:translate(14px,34px) rotate(24deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.aw-in,.aw-u,.aw-f,.aw-c,.aw-breathe,.aw-nod,.aw-row,.aw-drip,.aw-ring,.aw-dust,.aw-spark,.aw-glow,.aw-blink,.aw-sway,.aw-turn,.aw-patch,.aw-cloud,.aw-fall{animation:none!important}.aw-drip,.aw-dust,.aw-ring,.aw-fall{opacity:0}.aw-patch{transform:none}}
`;

const Defs = () => (
  <defs>
    <linearGradient id="aw-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.mid} /><stop offset="1" stopColor={C.navy} /></linearGradient>
    <linearGradient id="aw-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.deep} /><stop offset="1" stopColor={C.ink} /></linearGradient>
    <linearGradient id="aw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.ink} /><stop offset="1" stopColor={C.deep} /></linearGradient>
    <linearGradient id="aw-suit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={C.blue} /><stop offset="1" stopColor={C.deep} /></linearGradient>
    <linearGradient id="aw-suit2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={C.deep} /><stop offset="1" stopColor={C.mid} /></linearGradient>
    <linearGradient id="aw-skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B17E5C" /><stop offset="1" stopColor={C.skinD} /></linearGradient>
    <linearGradient id="aw-hat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD84D" /><stop offset=".6" stopColor={C.yel} /><stop offset="1" stopColor={C.yelD} /></linearGradient>
    <linearGradient id="aw-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.pale} /><stop offset=".5" stopColor={C.line} /><stop offset="1" stopColor="#8E96AA" /></linearGradient>
    <linearGradient id="aw-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD84D" /><stop offset="1" stopColor="#E0A800" /></linearGradient>
    <radialGradient id="aw-light" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={C.yel} stopOpacity=".55" /><stop offset="1" stopColor={C.yel} stopOpacity="0" /></radialGradient>
  </defs>
);

const Reduced = createContext(false);

/** Rotates its children about (cx, cy), easing between two angles forever (SMIL, so it composes correctly when nested). */
function Swing({ cx, cy, a, b, dur, children }: { cx: number; cy: number; a: number; b: number; dur: number; children: React.ReactNode }) {
  const reduced = useContext(Reduced);
  return (
    <g transform={`rotate(${a} ${cx} ${cy})`}>
      {!reduced && <animateTransform attributeName="transform" type="rotate" values={`${a} ${cx} ${cy};${b} ${cx} ${cy};${a} ${cx} ${cy}`} keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur={`${dur * 2}s`} repeatCount="indefinite" />}
      {children}
    </g>
  );
}

type Pose = { u0: number; u1: number; f0: number; f1: number; t?: number };
const deg = (n: number) => `${n}deg`;

/** Jointed arm. Hanging down at rest; negative angles raise it forward. Children are drawn in the forearm frame, hand at (x, y + 96). */
function Arm({ x, y, pose, back, children }: { x: number; y: number; pose: Pose; back?: boolean; children?: React.ReactNode }) {
  const t = pose.t ?? 1;
  const sleeve = back ? C.deep : C.blue;
  return (
    <Swing cx={x} cy={y} a={pose.u0} b={pose.u1} dur={t}>
      <path d={`M${x} ${y}V${y + 48}`} stroke={sleeve} strokeWidth="17" strokeLinecap="round" />
      <path d={`M${x - 6} ${y + 4}V${y + 44}`} stroke={C.sky} strokeWidth="2" strokeLinecap="round" opacity={back ? 0 : 0.45} />
      <Swing cx={x} cy={y + 48} a={pose.f0} b={pose.f1} dur={t}>
        <path d={`M${x} ${y + 48}V${y + 74}`} stroke={sleeve} strokeWidth="15" strokeLinecap="round" />
        <rect x={x - 8.5} y={y + 70} width="17" height="6" rx="3" fill={C.pale} opacity=".9" />
        <path d={`M${x} ${y + 74}V${y + 84}`} stroke={C.skin} strokeWidth="11" strokeLinecap="round" />
        <rect x={x - 7.5} y={y + 80} width="15" height="17" rx="7" fill={back ? "#AEB5C6" : C.line} />
        <path d={`M${x - 4} ${y + 86}h8`} stroke="#8E96AA" strokeWidth="1.2" strokeLinecap="round" />
        {children}
      </Swing>
    </Swing>
  );
}

function Worker({ front, rear }: { front: React.ReactNode; rear?: React.ReactNode }) {
  return (
    <g>
      <ellipse cx="116" cy="343" rx="58" ry="7" fill={C.ink} opacity=".55" />
      <g className="aw-breathe">
        {/* far arm sits behind the body */}
        {rear}
        {/* legs */}
        <path d="M98 262L96 300L94 330" stroke="url(#aw-suit2)" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M122 262L127 300L130 330" stroke="url(#aw-suit)" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="88" y="298" width="16" height="5" rx="2" fill={C.ink} opacity=".35" />
        <rect x="119" y="298" width="17" height="5" rx="2" fill={C.ink} opacity=".35" />
        <path d="M82 332q0-9 10-9h14q6 0 6 6v10H82z" fill="#2A3350" />
        <path d="M112 332q0-9 10-9h16q9 2 12 9v10h-38z" fill="#363F5E" />
        <rect x="80" y="340" width="28" height="5" rx="2" fill={C.ink} />
        <rect x="110" y="340" width="40" height="5" rx="2" fill={C.ink} />
        {/* torso */}
        <path d="M86 172q-2-24 18-27h26q18 3 16 27l-3 96q0 8-8 8H97q-8 0-8-8z" fill="url(#aw-suit)" />
        <path d="M90 172q-1-18 12-22" stroke={C.sky} strokeWidth="2" strokeLinecap="round" fill="none" opacity=".5" />
        <path d="M89 205H143M89 213H143" stroke={C.pale} strokeWidth="5" opacity=".92" />
        <path d="M118 150v125" stroke={C.ink} strokeWidth="1.5" opacity=".35" />
        <rect x="88" y="252" width="56" height="11" fill={C.ink} opacity=".85" />
        <rect x="112" y="254" width="9" height="7" rx="1.5" fill={C.yel} />
        <rect x="124" y="260" width="18" height="24" rx="4" fill={C.mid} stroke={C.ink} strokeWidth="1.5" />
        <path d="M127 268h12" stroke={C.line} strokeWidth="2" strokeLinecap="round" />
        <path d="M124 178q9-10 18 0" stroke={C.yel} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <circle cx="133" cy="181" r="2.2" fill={C.yel} />
        {/* collar and neck */}
        <path d="M100 146l13 14 13-14" fill="none" stroke={C.deep} strokeWidth="5" strokeLinejoin="round" />
        <rect x="105" y="130" width="17" height="20" rx="6" fill="url(#aw-skin)" />
        <g className="aw-nod">
          <ellipse cx="113" cy="112" rx="19.5" ry="22" fill="url(#aw-skin)" />
          <circle cx="97" cy="116" r="4.6" fill={C.skinD} />
          <path d="M120 106q5-3 10 0" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <ellipse cx="125" cy="112" rx="2.1" ry="2.6" fill={C.ink} />
          <circle cx="125.7" cy="111.2" r=".7" fill="#fff" />
          <path d="M131 114q4 4 0 8" stroke={C.skinD} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M120 128q8 3 14-3" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" opacity=".75" />
          <path d="M96 108q2 22 18 24" stroke={C.ink} strokeWidth="5" strokeLinecap="round" fill="none" opacity=".18" />
          {/* hard hat */}
          <path d="M90 108Q90 78 114 77Q138 78 138 108Z" fill="url(#aw-hat)" />
          <rect x="108" y="78" width="11" height="30" fill={C.yelD} opacity=".85" />
          <path d="M96 100Q100 86 112 83" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".4" />
          <path d="M86 108H149q3 0 3 3.4v.6H86q-3 0-3-3.5 0-.5 3-.5z" fill={C.yelD} />
          <path d="M86 108H148q2 0 2 2H86z" fill="url(#aw-hat)" />
        </g>
        {front}
      </g>
    </g>
  );
}

/* ---------- Scenes ---------- */

function Tiles() {
  return (
    <g stroke={C.deep} strokeWidth="1" opacity=".55">
      {Array.from({ length: 12 }, (_, i) => <path key={`v${i}`} d={`M${i * 32} 0V340`} />)}
      {Array.from({ length: 11 }, (_, i) => <path key={`h${i}`} d={`M0 ${i * 32}H360`} />)}
    </g>
  );
}

function Plumbing() {
  const wrench = (
    <g transform="translate(124 268)">
      <rect x="-3.5" y="0" width="7" height="42" rx="3" fill="url(#aw-metal)" />
      <path d="M-9 42h18v12h-5v-6h-8v6h-5z" fill="url(#aw-metal)" />
      <path d="M-9 42h18" stroke="#8E96AA" strokeWidth="1.5" />
    </g>
  );
  return (
    <g>
      <rect width="360" height="340" fill="url(#aw-wall)" /><Tiles />
      <rect x="252" y="30" width="108" height="14" fill={C.deep} opacity=".6" />
      {/* supply pipe, valve and the leaking compression joint */}
      <rect x="196" y="200" width="164" height="20" rx="3" fill="url(#aw-metal)" />
      <rect x="196" y="203" width="164" height="3" fill="#fff" opacity=".45" />
      <rect x="300" y="220" width="20" height="52" fill="url(#aw-metal)" />
      <path d="M300 272h20v30a10 10 0 0 1-20 0z" fill="none" />
      <rect x="226" y="194" width="22" height="32" rx="4" fill={C.pale} /><rect x="226" y="194" width="22" height="6" rx="3" fill="#fff" opacity=".6" />
      <path d="M229 205v16M233 205v16M237 205v16M241 205v16M245 205v16" stroke="#8E96AA" strokeWidth="1" />
      <g><rect x="290" y="186" width="40" height="14" rx="4" fill="url(#aw-metal)" />
        <rect x="306" y="176" width="8" height="12" fill="#8E96AA" />
        <g className="aw-turn" style={{ animationDuration: "6s" }}><circle cx="310" cy="172" r="15" fill={C.yel} /><circle cx="310" cy="172" r="5.5" fill={C.yelD} /><path d="M310 157v30M295 172h30" stroke={C.yelD} strokeWidth="3" /></g></g>
      {[0, 0.4, 0.8].map((d, i) => <path key={i} className="aw-drip" style={{ animationDelay: `${d}s`, ["--fall" as string]: "104px" }} d="M237 230c3.5 6 6 9.5 0 12.5c-6-3-3.5-6.500 0-12.500z" fill="#fff" />)}
      {/* bucket catching the drip */}
      <path d="M205 292h66l-6 46h-54z" fill="url(#aw-metal)" /><ellipse cx="238" cy="292" rx="33" ry="7" fill="#8E96AA" /><ellipse cx="238" cy="293" rx="28" ry="5" fill={C.ink} opacity=".75" />
      <ellipse className="aw-ring" cx="238" cy="295" rx="18" ry="3.5" fill="none" stroke="#fff" strokeWidth="1.5" />
      <ellipse className="aw-ring" style={{ animationDelay: ".6s" }} cx="238" cy="295" rx="18" ry="3.5" fill="none" stroke="#fff" strokeWidth="1.5" />
      <rect y="340" width="360" height="60" fill="url(#aw-floor)" />
      <Worker rear={<Arm x={104} y={172} back pose={{ u0: -18, u1: -24, f0: -22, f1: -30, t: 2 }} />}
        front={<Arm x={124} y={172} pose={{ u0: -40, u1: -40, f0: -62, f1: -42, t: 0.7 }}>{wrench}</Arm>} />
    </g>
  );
}

function Electrical() {
  const driver = (
    <g transform="translate(124 266)">
      <rect x="-5" y="-2" width="10" height="20" rx="4" fill={C.yel} /><rect x="-5" y="4" width="10" height="3" fill={C.yelD} />
      <rect x="-1.6" y="18" width="3.2" height="34" fill="url(#aw-metal)" /><rect x="-1.6" y="40" width="3.2" height="12" fill={C.ink} opacity=".5" />
    </g>
  );
  return (
    <g>
      <rect width="360" height="340" fill="url(#aw-wall)" />
      <g stroke={C.deep} strokeWidth="1" opacity=".5">{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M0 ${i * 40}H360`} />)}</g>
      <ellipse className="aw-glow" cx="70" cy="150" rx="150" ry="150" fill="url(#aw-light)" />
      {/* hanging work light */}
      <g className="aw-sway"><path d="M70 0V58" stroke={C.line} strokeWidth="2" /><path d="M58 74a15 15 0 1 1 24 0c-3 4-3 8-3 11H61c0-3 0-7-3-11z" fill={C.yel} /><rect x="60" y="84" width="20" height="9" rx="3" fill="url(#aw-metal)" /></g>
      {/* fuse board */}
      <rect x="194" y="60" width="146" height="196" rx="8" fill={C.mid} stroke={C.line} strokeWidth="3" />
      <rect x="204" y="70" width="126" height="176" rx="5" fill={C.ink} />
      {[0, 1].map((r) => (
        <g key={r}>
          <rect x="212" y={92 + r * 70} width="110" height="6" rx="2" fill="#8E96AA" />
          {Array.from({ length: 6 }, (_, i) => <g key={i}><rect x={214 + i * 18} y={98 + r * 70} width="14" height="34" rx="2.5" fill={C.pale} /><rect x={217 + i * 18} y={102 + r * 70} width="8" height="12" rx="1.5" fill={(i + r) % 3 === 0 ? C.yel : C.line} /></g>)}
        </g>
      ))}
      <rect className="aw-blink" x="214" y="80" width="6" height="6" rx="3" fill={C.yel} /><rect x="226" y="80" width="6" height="6" rx="3" fill={C.line} opacity=".5" />
      {/* bundled cables */}
      <g fill="none" strokeLinecap="round" strokeWidth="4"><path d="M240 60V10" stroke={C.yel} /><path d="M252 60V6" stroke={C.pale} /><path d="M264 60V14" stroke={C.line} /></g>
      <path d="M220 246c0 40 24 36 24 70" stroke={C.yel} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M250 246c0 30 20 26 20 60" stroke={C.pale} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* sparks at the tool tip */}
      <g className="aw-spark" stroke={C.yel} strokeWidth="2.6" strokeLinecap="round"><path d="M218 148l9-8M220 154l12 1M218 160l8 8" /></g>
      <g className="aw-spark" style={{ animationDelay: ".2s" }} fill={C.yel}><circle cx="228" cy="138" r="1.8" /><circle cx="235" cy="158" r="1.6" /></g>
      <rect y="340" width="360" height="60" fill="url(#aw-floor)" />
      {/* tool box */}
      <rect x="250" y="318" width="64" height="24" rx="4" fill={C.yel} /><rect x="250" y="318" width="64" height="7" rx="3" fill={C.yelD} /><rect x="276" y="312" width="12" height="8" rx="3" fill="none" stroke={C.line} strokeWidth="3" />
      <Worker rear={<Arm x={104} y={172} back pose={{ u0: -12, u1: -18, f0: -14, f1: -20, t: 2 }} />}
        front={<Arm x={124} y={172} pose={{ u0: -80, u1: -80, f0: -47, f1: -53, t: 0.45 }}>{driver}</Arm>} />
    </g>
  );
}

function Carpentry() {
  const saw = (
    <g transform="translate(124 264)">
      <path d="M-9 -6h18l3 24h-24z" fill={C.deep} stroke={C.ink} strokeWidth="1.5" />
      <path d="M-4 2v10" stroke={C.ink} strokeWidth="2" opacity=".5" />
      <rect x="-7" y="16" width="14" height="96" rx="2" fill="url(#aw-metal)" />
      <path d="M-7.5 20V112" stroke={C.ink} strokeWidth="2.6" strokeDasharray="2.6 2.6" />
    </g>
  );
  return (
    <g>
      <rect width="360" height="340" fill="url(#aw-wall)" />
      {/* pegboard with tool outlines */}
      <rect x="8" y="22" width="344" height="150" rx="6" fill={C.deep} opacity=".45" />
      <g fill={C.ink} opacity=".5">{Array.from({ length: 9 }, (_, r) => Array.from({ length: 22 }, (_, c) => <circle key={`${r}-${c}`} cx={22 + c * 15.4} cy={34 + r * 16} r="1.3" />))}</g>
      <g stroke={C.line} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".85">
        <path d="M200 44V96M188 44h24" /><path d="M236 40l30 56M232 64l22-8" /><path d="M290 44v54h40" /><path d="M296 44h12" />
      </g>
      <rect x="196" y="38" width="14" height="22" rx="2" fill={C.yel} opacity=".9" />
      <ellipse className="aw-glow" cx="300" cy="40" rx="110" ry="40" fill="url(#aw-light)" opacity=".5" />
      {/* sawhorse bench */}
      <rect x="178" y="236" width="170" height="14" rx="3" fill="url(#aw-metal)" />
      <path d="M192 250l-12 90M200 250l12 90M334 250l12 90M326 250l-12 90" stroke={C.line} strokeWidth="7" strokeLinecap="round" />
      {/* plank, already cut through on the left */}
      <g className="aw-fall" style={{ transformOrigin: "232px 222px" }}><rect x="190" y="218" width="42" height="18" rx="2" fill="url(#aw-wood)" /><path d="M194 224h30M194 230h24" stroke={C.yelD} strokeWidth="1.4" opacity=".7" /></g>
      <rect x="236" y="218" width="104" height="18" rx="2" fill="url(#aw-wood)" />
      <path d="M244 224h70M256 230h74" stroke={C.yelD} strokeWidth="1.4" opacity=".7" /><ellipse cx="320" cy="227" rx="6" ry="3" fill="none" stroke={C.yelD} strokeWidth="1.2" />
      <rect x="318" y="204" width="10" height="16" rx="2" fill={C.line} /><rect x="314" y="236" width="18" height="6" rx="2" fill={C.line} />
      {Array.from({ length: 7 }, (_, i) => <circle key={i} className="aw-dust" r="2.2" cx={230 + i * 3} cy="236" fill={C.yel} style={{ animationDelay: `${i * 0.13}s`, ["--dx" as string]: `${-6 + i * 3}px`, ["--dy" as string]: `${70 + (i % 3) * 12}px` }} />)}
      {/* wood shavings */}
      <g fill="none" stroke={C.yel} strokeWidth="2.2" strokeLinecap="round" opacity=".85"><path d="M180 336c4-8 12-8 14 0" /><path d="M270 338c3-7 11-7 13 0" /><path d="M300 334c4-8 10-6 12 0" /></g>
      <rect y="340" width="360" height="60" fill="url(#aw-floor)" />
      <Worker rear={<Arm x={104} y={172} back pose={{ u0: -48, u1: -50, f0: -34, f1: -38, t: 2 }} />}
        front={<Arm x={124} y={172} pose={{ u0: -24, u1: -44, f0: -66, f1: -46, t: 0.5 }}>{saw}</Arm>} />
    </g>
  );
}

function Masonry() {
  const trowel = (
    <g transform="translate(124 268) rotate(-8)">
      <rect x="-3.5" y="-6" width="7" height="14" rx="3" fill={C.deep} />
      <path d="M-2 8L-2 18" stroke={C.line} strokeWidth="3" />
      <path d="M-13 20L13 20L2 54L-2 54Z" fill="url(#aw-metal)" stroke="#8E96AA" strokeWidth="1" />
    </g>
  );
  const rows = [0, 1, 2, 3, 4];
  return (
    <g>
      <rect width="360" height="340" fill="url(#aw-sky)" />
      <circle cx="300" cy="70" r="26" fill={C.yel} />
      <g className="aw-cloud" fill={C.pale} opacity=".14"><ellipse cx="90" cy="74" rx="46" ry="10" /><ellipse cx="120" cy="66" rx="28" ry="10" /><ellipse cx="220" cy="120" rx="40" ry="8" /></g>
      <g fill={C.mid}><rect x="0" y="230" width="46" height="110" /><rect x="50" y="200" width="36" height="140" /><rect x="94" y="246" width="54" height="94" /></g>
      <g fill={C.yel} opacity=".5"><rect x="58" y="212" width="6" height="8" /><rect x="70" y="212" width="6" height="8" /><rect x="58" y="228" width="6" height="8" /><rect x="8" y="244" width="6" height="8" /></g>
      {/* scaffold */}
      <g stroke={C.line} strokeWidth="4" strokeLinecap="round" opacity=".55"><path d="M200 120V340M352 120V340M200 190H352M200 120H352" /></g>
      {/* the wall under construction: rows appear as they are laid */}
      <rect x="204" y="318" width="144" height="22" fill={C.ink} opacity=".6" />
      {rows.map((r) => (
        <g key={r} className="aw-row" style={{ animationDelay: `${r * 0.85}s` }}>
          {Array.from({ length: r % 2 ? 5 : 6 }, (_, c) => (
            <g key={c}><rect x={(r % 2 ? 214 : 204) + c * 24} y={308 - r * 17} width="22.5" height="15" rx="1.5" fill={r === 4 ? C.yel : "#9AA3B8"} />
              <rect x={(r % 2 ? 214 : 204) + c * 24} y={308 - r * 17} width="22.5" height="4" rx="1.5" fill="#fff" opacity=".28" /></g>
          ))}
        </g>
      ))}
      {/* string line and level */}
      <path d="M202 214H350" stroke={C.pale} strokeWidth="1.2" strokeDasharray="1 0" opacity=".8" /><path d="M350 214l-10-6v12z" fill={C.yel} />
      {/* mortar bucket and trowel board */}
      <path d="M150 300h50l-5 40h-40z" fill="url(#aw-metal)" /><ellipse cx="175" cy="300" rx="25" ry="6" fill="#8E96AA" /><ellipse cx="175" cy="301" rx="21" ry="4" fill={C.line} opacity=".7" />
      <rect y="340" width="360" height="60" fill="url(#aw-floor)" />
      <Worker rear={<Arm x={104} y={172} back pose={{ u0: -30, u1: -36, f0: -30, f1: -40, t: 1.4 }} />}
        front={<Arm x={124} y={172} pose={{ u0: -32, u1: -26, f0: -40, f1: -30, t: 0.9 }}>{trowel}</Arm>} />
    </g>
  );
}

function Painting() {
  const roller = (
    <g transform="translate(124 266)">
      <Swing cx={0} cy={0} a={112} b={140} dur={2.2}>
        <path d="M0 0H20" stroke={C.line} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <rect x="16" y="-36" width="24" height="56" rx="9" fill={C.pale} />
        <rect x="18" y="-34" width="7" height="52" rx="3.5" fill="#fff" opacity=".55" />
        <rect x="16" y="-36" width="24" height="14" rx="7" fill={C.yel} opacity=".95" />
      </Swing>
    </g>
  );
  return (
    <g>
      <rect width="360" height="340" fill="url(#aw-wall)" />
      {/* window with daylight */}
      <rect x="22" y="40" width="96" height="110" rx="4" fill={C.ink} /><rect x="28" y="46" width="84" height="98" fill={C.deep} /><path d="M70 46v98M28 95h84" stroke={C.ink} strokeWidth="4" />
      <path d="M28 46h40l-30 98H28z" fill="#fff" opacity=".07" />
      {/* wall being painted: the yellow coat grows upward behind the roller */}
      <rect x="196" y="40" width="150" height="300" fill={C.mid} />
      <rect className="aw-patch" style={{ ["--t" as string]: "2.2s" }} x="196" y="104" width="62" height="236" rx="3" fill={C.yel} />
      <rect x="196" y="104" width="62" height="236" fill="url(#aw-light)" opacity=".0" />
      <path className="aw-drip" style={{ ["--fall" as string]: "30px", animationDuration: "2.2s" }} d="M230 110v10a3 3 0 0 0 6 0v-10z" fill={C.yel} />
      {/* skirting, drop cloth, tray, can */}
      <rect x="196" y="324" width="150" height="16" fill={C.deep} />
      <path d="M150 340l36-14h150l22 14z" fill={C.pale} opacity=".14" />
      <path d="M250 322h74l-6 14h-62z" fill="url(#aw-metal)" /><path d="M254 324h66" stroke={C.yel} strokeWidth="6" strokeLinecap="round" />
      <rect x="296" y="296" width="44" height="42" rx="4" fill="url(#aw-metal)" /><ellipse cx="318" cy="296" rx="22" ry="5" fill={C.yel} /><rect x="296" y="312" width="44" height="12" fill={C.yel} opacity=".9" />
      <rect y="340" width="360" height="60" fill="url(#aw-floor)" />
      <Worker rear={<Arm x={104} y={172} back pose={{ u0: -22, u1: -30, f0: -26, f1: -34, t: 2 }} />}
        front={<Arm x={124} y={172} pose={{ u0: -70, u1: -125, f0: -40, f1: -15, t: 2.2 }}>{roller}</Arm>} />
    </g>
  );
}

export const AT_WORK = [
  { slug: "plumbing", label: "Plumbing", note: "Fixing a leaking joint", Scene: Plumbing },
  { slug: "electrical", label: "Electrical", note: "Wiring a fuse board", Scene: Electrical },
  { slug: "carpentry", label: "Carpentry", note: "Cutting a timber plank", Scene: Carpentry },
  { slug: "masonry", label: "Masonry", note: "Laying a block wall", Scene: Masonry },
  { slug: "painting", label: "Painting", note: "Rolling a fresh coat", Scene: Painting },
];
const STEP_MS = 5200;

/** Animated illustrated scenes of the five trades at work, with a caption card. Pauses on hover and for reduced motion. */
export function HeroIllustration() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => { setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => setI((n) => (n + 1) % AT_WORK.length), STEP_MS);
    return () => clearTimeout(t);
  }, [i, paused, reduced]);
  const cur = AT_WORK[i];
  const Scene = cur.Scene;
  return (
    <div className="hidden w-full max-w-[24rem] lg:block" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative aspect-[9/10] overflow-hidden rounded-3xl bg-[#0B1530] shadow-hover ring-1 ring-white/10">
        <style>{CSS}</style>
        <svg viewBox="0 0 360 400" className="absolute inset-0 h-full w-full" role="img" aria-label={`Illustration: a ${cur.label.toLowerCase()} professional ${cur.note.toLowerCase()}`}>
          <Defs />
          <Reduced.Provider value={reduced}><g key={i} className="aw-in"><Scene /></g></Reduced.Provider>
        </svg>
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
        <p key={cur.slug} className="flex flex-wrap items-baseline gap-x-2 text-xl font-semibold leading-tight">{cur.label}<span className="text-sm font-normal text-muted-foreground">{cur.note}</span></p>
        <div className="mt-2 flex gap-1.5" role="tablist" aria-label="Trades">
          {AT_WORK.map((w, n) => (
            <button key={w.slug} type="button" role="tab" aria-selected={n === i} aria-label={w.label} onClick={() => setI(n)} className="group relative h-6 flex-1 focus-visible:outline-none">
              <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-foreground/15 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <span key={n === i ? `a${i}${paused}` : "x"} className={cn("block h-full rounded-full bg-foreground", n < i || (reduced && n === i) ? "w-full" : "w-0", n === i && !reduced && !paused && "w-full origin-left animate-[heroFill_5.2s_linear_forwards]", n === i && paused && !reduced && "w-1/2")} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
