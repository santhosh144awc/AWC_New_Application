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

const PILLAR_LIST = [
  { key: 'cashFlow', num: '01', label: 'Cash Flow & Savings' },
  { key: 'emergencyFund', num: '02', label: 'Emergency Reserve' },
  { key: 'debt', num: '03', label: 'Debt Discipline' },
  { key: 'protection', num: '04', label: 'Life & Health Cover' },
  { key: 'investments', num: '05', label: 'Investment Alignment' },
  { key: 'goals', num: '06', label: 'Family Milestones' },
  { key: 'retirement', num: '07', label: 'Retirement Readiness' },
] as const;

export default function HealthIllustration({
  type,
  className = '',
}: HealthIllustrationProps): React.JSX.Element {
  const activeIdx = PILLAR_LIST.findIndex((p) => p.key === type);

  return (
    <svg
      viewBox="0 0 420 290"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Seven-pillar household financial health framework"
    >
      <rect x="8" y="8" width="404" height="274" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      <text x="28" y="36" fill="#0F766E" fontSize="10" fontWeight="700" letterSpacing="1.2">
        7-PILLAR DIAGNOSTIC FRAMEWORK
      </text>
      <line x1="28" y1="48" x2="392" y2="48" stroke="#F1F5F9" strokeWidth="1.5" />

      {PILLAR_LIST.map((pillar, idx) => {
        const y = 64 + idx * 30;
        const isActive = activeIdx === idx;
        const isPassed = activeIdx > idx;
        const isLanding = type === 'landing';

        return (
          <g key={pillar.key}>
            <rect
              x="24"
              y={y}
              width="372"
              height="24"
              rx="6"
              fill={isActive ? '#F0FDFA' : isPassed ? '#F8FAFC' : '#FFFFFF'}
              stroke={isActive ? '#0F766E' : '#E2E8F0'}
              strokeWidth={isActive ? '1.5' : '1'}
            />
            <text
              x="38"
              y={y + 15.5}
              fill={isActive ? '#0F766E' : '#64748B'}
              fontSize="10.5"
              fontWeight="700"
            >
              {pillar.num}
            </text>
            <text
              x="64"
              y={y + 15.5}
              fill={isActive ? '#0F172A' : isPassed ? '#334155' : '#475569'}
              fontSize="11.5"
              fontWeight={isActive ? '700' : '500'}
            >
              {pillar.label}
            </text>
            <rect
              x="312"
              y={y + 6}
              width="70"
              height="12"
              rx="6"
              fill={isActive ? '#CCFBF1' : isPassed || isLanding ? '#E2E8F0' : '#F1F5F9'}
            />
            <rect
              x="312"
              y={y + 6}
              width={isActive ? '52' : isPassed ? '70' : isLanding ? '46' : '18'}
              height="12"
              rx="6"
              fill={isActive || isPassed ? '#0F766E' : isLanding ? '#173047' : '#CBD5E1'}
            />
          </g>
        );
      })}
    </svg>
  );
}
