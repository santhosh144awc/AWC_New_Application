import React from 'react';

interface HealthIllustrationProps {
  type:
    | 'landing'
    | 'cashFlow'
    | 'emergencyFund'
    | 'debt'
    | 'protection'
    | 'investments'
    | 'goals'
    | 'retirement';
  className?: string;
}

export default function HealthIllustration({
  type,
  className = '',
}: HealthIllustrationProps): React.JSX.Element {
  switch (type) {
    case 'landing':
      return (
        <svg
          viewBox="0 0 500 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="homeField" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#d7f2e5" />
              <stop offset="1" stopColor="#f9e7ad" />
            </linearGradient>
            <linearGradient id="homeHouse" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#eaf8f1" />
            </linearGradient>
          </defs>
          <circle cx="248" cy="160" r="132" fill="url(#homeField)" opacity=".78" />
          <circle cx="248" cy="160" r="104" stroke="#9ed3c1" strokeWidth="1.5" strokeDasharray="4 7" />
          <circle cx="248" cy="160" r="78" stroke="#fff" strokeWidth="2" />
          <path d="M44 248C105 211 139 267 200 241s104-1 143 7 69-20 113-5" stroke="#a3d9c6" strokeWidth="3" strokeLinecap="round" opacity=".8" />
          <path d="M126 125 248 52l125 73" stroke="#173047" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M153 116v117c0 10 8 18 18 18h154c10 0 18-8 18-18V116L248 64z" fill="url(#homeHouse)" stroke="#173047" strokeWidth="5" strokeLinejoin="round" />
          <rect x="188" y="143" width="45" height="43" rx="9" fill="#d8f4e8" stroke="#137a71" strokeWidth="3" />
          <rect x="263" y="143" width="45" height="43" rx="9" fill="#fff0bf" stroke="#d39c28" strokeWidth="3" />
          <path d="M210 143v43M188 164h45M285 143v43M263 164h45" stroke="#fff" strokeWidth="2" />
          <rect x="226" y="193" width="44" height="58" rx="10" fill="#137a71" />
          <circle cx="258" cy="221" r="2.8" fill="#f3c85c" />
          <g transform="translate(50 113) rotate(-8)">
            <rect width="95" height="70" rx="14" fill="#fff" stroke="#d4e6df" strokeWidth="2" />
            <rect x="13" y="13" width="30" height="30" rx="8" fill="#e3f5ec" />
            <path d="M20 32h16M28 24v16" stroke="#137a71" strokeWidth="3" strokeLinecap="round" />
            <rect x="51" y="18" width="30" height="5" rx="2.5" fill="#cbded8" />
            <rect x="51" y="29" width="21" height="5" rx="2.5" fill="#cbded8" />
            <path d="M14 55h66" stroke="#f3c85c" strokeWidth="4" strokeLinecap="round" />
          </g>
          <g transform="translate(345 166) rotate(7)">
            <rect width="94" height="72" rx="14" fill="#173047" />
            <path d="M15 53V37M31 53V29M47 53V20M63 53V12" stroke="#82cdb3" strokeWidth="8" strokeLinecap="round" />
            <path d="M13 58h66" stroke="#f3c85c" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g transform="translate(353 48)">
            <circle cx="28" cy="28" r="28" fill="#fff" stroke="#c3e6d8" strokeWidth="2" />
            <path d="M28 13c-5 0-9 4-9 9 0 7 9 16 9 16s9-9 9-16c0-5-4-9-9-9z" fill="#f4d16d" />
            <circle cx="28" cy="22" r="3.5" fill="#173047" />
          </g>
          <g transform="translate(86 224)">
            <circle cx="25" cy="25" r="25" fill="#fff" />
            <circle cx="25" cy="25" r="15" stroke="#137a71" strokeWidth="3" />
            <circle cx="25" cy="25" r="5" fill="#f3c85c" />
          </g>
          <g transform="translate(373 260)">
            <circle cx="18" cy="18" r="18" fill="#f3c85c" />
            <path d="M10 18h16M18 10v16" stroke="#173047" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'cashFlow':
      return (
        <svg
          viewBox="0 0 440 300"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          role="img"
          aria-label="Illustration of income flowing into a household budget and savings"
        >
          <defs>
            <linearGradient id="cashMint" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#dbf4e9" />
              <stop offset="1" stopColor="#f7fbf8" />
            </linearGradient>
            <linearGradient id="cashGold" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f8d978" />
              <stop offset="1" stopColor="#e9ad3f" />
            </linearGradient>
          </defs>
          <circle cx="220" cy="150" r="118" fill="url(#cashMint)" />
          <circle cx="220" cy="150" r="91" fill="none" stroke="#b7dcd2" strokeWidth="1.5" strokeDasharray="4 7" />
          <path d="M64 102C109 70 135 98 171 124S245 172 285 141 344 114 378 135" fill="none" stroke="#147f75" strokeWidth="5" strokeLinecap="round" />
          <path d="M63 130C111 100 145 122 180 146S247 194 290 165 344 141 379 158" fill="none" stroke="#e5b13b" strokeWidth="3" strokeLinecap="round" opacity=".95" />
          <g transform="translate(70 62)">
            <rect x="0" y="0" width="68" height="76" rx="15" fill="#fff" stroke="#d4e8df" strokeWidth="2" />
            <rect x="13" y="15" width="42" height="28" rx="5" fill="#e0f5eb" />
            <path d="M22 30h24M22 36h15" stroke="#137a71" strokeWidth="3" strokeLinecap="round" />
            <circle cx="34" cy="58" r="7" fill="#f3c85c" />
            <path d="M34 53v10M30 56h8" stroke="#7b5d17" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <g transform="translate(267 142)">
            <rect x="0" y="0" width="91" height="75" rx="16" fill="#173047" />
            <rect x="12" y="13" width="67" height="13" rx="6.5" fill="#2a4d60" />
            <path d="M16 47h12v15H16zM33 39h12v23H33zM50 31h12v31H50z" fill="#82cdb3" />
            <path d="M15 63h62" stroke="#f3c85c" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g transform="translate(158 182)">
            <ellipse cx="23" cy="55" rx="30" ry="9" fill="#c4e5d8" />
            <ellipse cx="23" cy="44" rx="28" ry="8" fill="#f3c85c" stroke="#d8a834" strokeWidth="1.5" />
            <path d="M-5 31v13c0 5 13 8 28 8s28-3 28-8V31" fill="#f8d975" stroke="#d8a834" strokeWidth="1.5" />
            <ellipse cx="23" cy="31" rx="28" ry="8" fill="#ffe79b" stroke="#d8a834" strokeWidth="1.5" />
            <path d="M-2 19v12c0 4 11 7 25 7s25-3 25-7V19" fill="#eab34a" stroke="#d8a834" strokeWidth="1.5" />
            <ellipse cx="23" cy="19" rx="25" ry="7" fill="#f8d975" stroke="#d8a834" strokeWidth="1.5" />
          </g>
          <circle cx="345" cy="79" r="21" fill="#fff" stroke="#cce6dc" strokeWidth="2" />
          <path d="M335 80l7 7 13-16" fill="none" stroke="#137a71" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="102" cy="203" r="8" fill="#f3c85c" />
          <circle cx="357" cy="236" r="5" fill="#137a71" />
        </svg>
      );

    case 'emergencyFund':
      return (
        <svg
          viewBox="0 0 440 300"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          role="img"
          aria-label="Illustration of a protective reserve with layered savings coins"
        >
          <defs>
            <linearGradient id="resBg" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#dff5eb" />
              <stop offset="1" stopColor="#fff8e5" />
            </linearGradient>
            <linearGradient id="resShield" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#e9f8f1" />
            </linearGradient>
          </defs>
          <circle cx="220" cy="143" r="117" fill="url(#resBg)" />
          <circle cx="220" cy="143" r="89" fill="none" stroke="#c2e4d8" strokeWidth="2" />
          <circle cx="220" cy="143" r="66" fill="none" stroke="#d6e9e2" strokeWidth="2" strokeDasharray="5 7" />
          <ellipse cx="220" cy="243" rx="130" ry="18" fill="#d0e8df" />
          <g transform="translate(85 187)">
            <ellipse cx="34" cy="49" rx="36" ry="10" fill="#ddb24e" />
            <path d="M-2 35v14c0 7 16 10 36 10s36-3 36-10V35" fill="#f5ce62" stroke="#cc9a2c" strokeWidth="1.5" />
            <ellipse cx="34" cy="35" rx="36" ry="10" fill="#ffdf83" stroke="#cc9a2c" strokeWidth="1.5" />
            <path d="M6 21v14c0 6 12 9 28 9s28-3 28-9V21" fill="#edb84b" stroke="#cc9a2c" strokeWidth="1.5" />
            <ellipse cx="34" cy="21" rx="28" ry="8" fill="#ffe394" stroke="#cc9a2c" strokeWidth="1.5" />
          </g>
          <g transform="translate(291 203)">
            <ellipse cx="29" cy="33" rx="31" ry="8" fill="#9acdbb" />
            <path d="M-2 20v13c0 6 14 9 31 9s31-3 31-9V20" fill="#d7f0e4" stroke="#6eae9a" strokeWidth="1.5" />
            <ellipse cx="29" cy="20" rx="31" ry="8" fill="#ecfaf3" stroke="#6eae9a" strokeWidth="1.5" />
            <path d="M6 8v12c0 5 10 8 23 8s23-3 23-8V8" fill="#b4e2d0" stroke="#6eae9a" strokeWidth="1.5" />
            <ellipse cx="29" cy="8" rx="23" ry="7" fill="#e5f8ef" stroke="#6eae9a" strokeWidth="1.5" />
          </g>
          <path d="M220 62l58 23v48c0 47-25 80-58 100-33-20-58-53-58-100V85z" fill="url(#resShield)" stroke="#137a71" strokeWidth="4" strokeLinejoin="round" />
          <path d="M191 132l20 20 39-43" fill="none" stroke="#137a71" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="220" cy="62" r="7" fill="#f3c85c" />
          <circle cx="286" cy="87" r="5" fill="#173047" />
          <circle cx="154" cy="105" r="5" fill="#e4b53c" />
        </svg>
      );

    case 'debt':
      return (
        <svg
          viewBox="0 0 440 300"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          role="img"
          aria-label="Illustration of balanced loan payments and household income"
        >
          <defs>
            <linearGradient id="debtBg" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#e7f2f7" />
              <stop offset="1" stopColor="#fff3d4" />
            </linearGradient>
          </defs>
          <circle cx="220" cy="140" r="118" fill="url(#debtBg)" />
          <path d="M72 236Q220 205 368 236" stroke="#c3dcd8" strokeWidth="2" fill="none" />
          <ellipse cx="220" cy="242" rx="145" ry="14" fill="#d3e3e6" />
          <path d="M220 66v146" stroke="#173047" strokeWidth="8" strokeLinecap="round" />
          <path d="M139 115l81-28 81 28" fill="none" stroke="#137a71" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="220" cy="87" r="13" fill="#f3c85c" stroke="#b9851f" strokeWidth="2" />
          <path d="M142 115l-34 70M142 115l34 70M298 115l-34 70M298 115l34 70" stroke="#7ba9ac" strokeWidth="2.5" />
          <path d="M89 185q53 35 106 0" fill="#fff" stroke="#137a71" strokeWidth="2.5" />
          <path d="M245 185q53 35 106 0" fill="#fff" stroke="#d49b25" strokeWidth="2.5" />
          <path d="M89 185l17-34h71l18 34" fill="#d8f3e8" stroke="#137a71" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M245 185l17-34h71l18 34" fill="#fff0c1" stroke="#d49b25" strokeWidth="2.5" strokeLinejoin="round" />
          <g fill="#173047">
            <rect x="114" y="157" width="14" height="22" rx="3" />
            <rect x="132" y="147" width="14" height="32" rx="3" />
            <rect x="150" y="162" width="14" height="17" rx="3" />
          </g>
          <g fill="#137a71">
            <rect x="270" y="159" width="14" height="20" rx="3" />
            <rect x="288" y="151" width="14" height="28" rx="3" />
            <rect x="306" y="164" width="14" height="15" rx="3" />
          </g>
          <path d="M209 212h22l-11 22z" fill="#173047" />
          <rect x="171" y="235" width="98" height="9" rx="4.5" fill="#173047" />
        </svg>
      );

    case 'protection':
      return (
        <svg
          viewBox="0 0 440 300"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          role="img"
          aria-label="Illustration of a protective canopy sheltering a family home"
        >
          <defs>
            <linearGradient id="proBg" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#e2f5ed" />
              <stop offset="1" stopColor="#f9f0d8" />
            </linearGradient>
          </defs>
          <circle cx="220" cy="145" r="118" fill="url(#proBg)" />
          <circle cx="220" cy="145" r="91" fill="none" stroke="#c8e3da" strokeWidth="2" />
          <path d="M87 125a133 89 0 0 1 266 0c-17-14-32-14-49 0-17-14-32-14-49 0-17-14-32-14-49 0-17-14-32-14-49 0-17-14-32-14-49 0z" fill="#173047" />
          <path d="M220 125v68c0 17-15 17-22 8" fill="none" stroke="#cf9a2a" strokeWidth="8" strokeLinecap="round" />
          <path d="M220 125v67" stroke="#cf9a2a" strokeWidth="7" strokeLinecap="round" />
          <path d="M157 209h126l-13 44h-100z" fill="#cdeee0" />
          <path d="M179 211v42M199 211v42M220 211v42M241 211v42M261 211v42" stroke="#a3d5c3" strokeWidth="2" />
          <rect x="176" y="183" width="88" height="52" rx="14" fill="#fff" stroke="#137a71" strokeWidth="3" />
          <path d="M193 205h54" stroke="#137a71" strokeWidth="4" strokeLinecap="round" />
          <circle cx="220" cy="207" r="4" fill="#f3c85c" />
          <circle cx="111" cy="126" r="8" fill="#f3c85c" />
          <circle cx="328" cy="126" r="8" fill="#137a71" />
          <path d="M90 265h260" stroke="#c1ded3" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'investments':
      return (
        <svg
          viewBox="0 0 440 300"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          role="img"
          aria-label="Illustration of investments growing across a longer timeline"
        >
          <defs>
            <linearGradient id="invArea" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#a9e0cc" stopOpacity=".8" />
              <stop offset="1" stopColor="#a9e0cc" stopOpacity=".05" />
            </linearGradient>
            <linearGradient id="invBg" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#e3f5ec" />
              <stop offset="1" stopColor="#fff3d1" />
            </linearGradient>
          </defs>
          <circle cx="220" cy="143" r="118" fill="url(#invBg)" />
          <path d="M73 237H370" stroke="#9ebdbb" strokeWidth="2" />
          <path d="M83 220C130 213 145 201 181 187S239 157 274 117 330 76 362 59L362 237H83z" fill="url(#invArea)" />
          <path d="M83 220C130 213 145 201 181 187S239 157 274 117 330 76 362 59" stroke="#137a71" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M83 237V72" stroke="#173047" strokeWidth="3" strokeLinecap="round" />
          <path d="M75 85l8-14 8 14" fill="none" stroke="#173047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <g>
            <circle cx="112" cy="214" r="8" fill="#f3c85c" stroke="#fff" strokeWidth="3" />
            <circle cx="190" cy="183" r="8" fill="#fff" stroke="#137a71" strokeWidth="4" />
            <circle cx="274" cy="117" r="8" fill="#f3c85c" stroke="#fff" strokeWidth="3" />
            <circle cx="362" cy="59" r="9" fill="#173047" stroke="#f3c85c" strokeWidth="4" />
          </g>
          <g transform="translate(112 233)">
            <ellipse cx="0" cy="0" rx="20" ry="6" fill="#e9b23c" />
            <path d="M-20-11v11c0 4 9 6 20 6s20-2 20-6v-11" fill="#f8d777" stroke="#c58f22" strokeWidth="1.5" />
            <ellipse cx="0" cy="-11" rx="20" ry="6" fill="#ffe79c" stroke="#c58f22" strokeWidth="1.5" />
          </g>
          <g transform="translate(332 207)">
            <rect x="-10" y="-40" width="20" height="40" rx="4" fill="#f3c85c" />
            <rect x="-36" y="-24" width="20" height="24" rx="4" fill="#8acbb4" />
            <rect x="16" y="-61" width="20" height="61" rx="4" fill="#173047" />
          </g>
        </svg>
      );

    case 'goals':
      return (
        <svg
          viewBox="0 0 440 300"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          role="img"
          aria-label="Illustration of a path with milestones leading toward a goal"
        >
          <defs>
            <linearGradient id="goalBg" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fff4d0" />
              <stop offset="1" stopColor="#e6f6ee" />
            </linearGradient>
          </defs>
          <circle cx="220" cy="143" r="118" fill="url(#goalBg)" />
          <path d="M70 244C111 228 99 193 147 184s42-8 65-38 44-23 55-44 43-27 85-34" fill="none" stroke="#d1e4da" strokeWidth="28" strokeLinecap="round" />
          <path d="M70 244C111 228 99 193 147 184s42-8 65-38 44-23 55-44 43-27 85-34" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
          <path d="M70 244C111 228 99 193 147 184s42-8 65-38 44-23 55-44 43-27 85-34" fill="none" stroke="#137a71" strokeWidth="3" strokeDasharray="5 7" strokeLinecap="round" />
          <g>
            <circle cx="114" cy="210" r="21" fill="#fff" stroke="#137a71" strokeWidth="3" />
            <circle cx="114" cy="210" r="7" fill="#f3c85c" />
            <circle cx="219" cy="146" r="21" fill="#fff" stroke="#e1aa31" strokeWidth="3" />
            <circle cx="219" cy="146" r="7" fill="#137a71" />
            <circle cx="329" cy="78" r="21" fill="#fff" stroke="#173047" strokeWidth="3" />
            <circle cx="329" cy="78" r="7" fill="#f3c85c" />
          </g>
          <path d="M366 42v60" stroke="#173047" strokeWidth="4" strokeLinecap="round" />
          <path d="M366 42l41 10-41 13z" fill="#f3c85c" stroke="#173047" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="86" cy="74" r="5" fill="#f3c85c" />
          <circle cx="334" cy="234" r="7" fill="#137a71" />
          <circle cx="282" cy="259" r="4" fill="#173047" />
        </svg>
      );

    case 'retirement':
      return (
        <svg
          viewBox="0 0 440 300"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          role="img"
          aria-label="Illustration of a calm horizon and a path into later life"
        >
          <defs>
            <linearGradient id="retBg" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fff0c4" />
              <stop offset="1" stopColor="#e3f6ed" />
            </linearGradient>
            <linearGradient id="retSun" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#f8d76e" />
              <stop offset="1" stopColor="#f0b74b" />
            </linearGradient>
          </defs>
          <circle cx="220" cy="145" r="118" fill="url(#retBg)" />
          <circle cx="274" cy="105" r="48" fill="url(#retSun)" />
          <path d="M78 177c37-31 78-30 112 0 35-34 85-43 137-5 23-15 43-15 60-1v73H78z" fill="#b5e1d0" />
          <path d="M78 202c45-20 82-12 116 15 43-28 86-25 125-4 24-12 46-10 68 0v31H78z" fill="#137a71" opacity=".82" />
          <path d="M120 244c48-20 79-21 113-6s70 12 106-7" fill="none" stroke="#f9f5dc" strokeWidth="8" strokeLinecap="round" />
          <path d="M120 244c48-20 79-21 113-6s70 12 106-7" fill="none" stroke="#173047" strokeOpacity=".38" strokeWidth="2" strokeLinecap="round" />
          <path d="M124 180l26-24 26 24v35h-52z" fill="#fff" stroke="#173047" strokeWidth="3" strokeLinejoin="round" />
          <path d="M144 215v-21h15v21" fill="#f3c85c" stroke="#173047" strokeWidth="2" />
          <circle cx="111" cy="93" r="7" fill="#137a71" />
          <circle cx="344" cy="168" r="7" fill="#f3c85c" />
          <path d="M100 264h240" stroke="#b2dacc" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    default:
      return <div className={className} />;
  }
}
