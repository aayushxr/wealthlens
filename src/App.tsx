import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────

interface SIPInputs {
  monthlySIP: number
  annualReturn: number
  years: number
}

interface SIPResult {
  finalValue: number
  totalInvested: number
  wealthGained: number
  yearlyData: { year: number; invested: number; value: number }[]
}

// ── SIP Calculator Hook ────────────────────────────────────────────────────

/**
 * Calculates SIP projections using the annuity-due future value formula:
 *   FV = P × ((1 + r)^n − 1) / r × (1 + r)
 *
 * @param inputs - { monthlySIP: monthly investment (₹), annualReturn: % p.a., years: duration }
 * @returns finalValue, totalInvested, wealthGained, and a yearlyData array for charting
 */
function useSIPCalculator(inputs: SIPInputs): SIPResult {
  return useMemo(() => {
    const { monthlySIP: P, annualReturn, years } = inputs
    const r = annualReturn / 12 / 100

    if (P <= 0 || annualReturn <= 0 || years <= 0) {
      return { finalValue: 0, totalInvested: 0, wealthGained: 0, yearlyData: [] }
    }

    // Annuity-due FV: P × ((1+r)^n − 1) / r × (1+r)
    function fvForMonths(months: number): number {
      return P * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
    }

    const finalValue = fvForMonths(years * 12)
    const totalInvested = P * years * 12

    const yearlyData: SIPResult['yearlyData'] = []
    for (let t = 1; t <= years; t++) {
      yearlyData.push({
        year: t,
        invested: Math.round(P * t * 12),
        value: Math.round(fvForMonths(t * 12)),
      })
    }

    return {
      finalValue: Math.round(finalValue),
      totalInvested: Math.round(totalInvested),
      wealthGained: Math.round(finalValue - totalInvested),
      yearlyData,
    }
  }, [inputs])
}

// ── Formatters ─────────────────────────────────────────────────────────────

/**
 * Formats a rupee value using Indian short-scale notation:
 *   ≥ 1 Crore (10^7) → "₹X.XX Cr"
 *   ≥ 1 Lakh  (10^5) → "₹X.XX L"
 *   otherwise        → locale-formatted with "₹" prefix
 */
function formatINR(value: number): string {
  if (value >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(2)} Cr`
  }
  if (value >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(2)} L`
  }
  return `₹${value.toLocaleString('en-IN')}`
}

// ── Components ─────────────────────────────────────────────────────────────

/** Props for a labeled range slider with optional prefix/suffix display. */
interface SliderFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
  prefix?: string
}

function SliderField({ label, value, onChange, min, max, step = 1, suffix, prefix }: SliderFieldProps) {
  const pct = ((value - min) / (max - min)) * 100
  const trackStyle = {
    background: `linear-gradient(to right, #224c87 0%, #224c87 ${pct}%, #E5E5E5 ${pct}%, #E5E5E5 100%)`,
  }
  return (
    <div style={styles.inputGroup}>
      <div style={styles.sliderHeader}>
        <label style={styles.inputLabel}>{label}</label>
        <span style={styles.sliderValueDisplay}>
          {prefix && <span style={styles.inputAffix}>{prefix}</span>}
          <span style={styles.sliderNumber}>{value}</span>
          {suffix && <span style={styles.inputAffix}>{suffix}</span>}
        </span>
      </div>
      <input
        type="range"
        className="sip-slider"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        style={trackStyle}
      />
    </div>
  )
}

/** Props for the summary card showing final corpus breakdown. */
interface SummaryCardProps {
  finalValue: number
  totalInvested: number
  wealthGained: number
}

function SummaryCard({ finalValue, totalInvested, wealthGained }: SummaryCardProps) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryRule} />
      <SummaryRow label="Final Value" value={formatINR(finalValue)} accent />
      <SummaryRow label="Total Invested" value={formatINR(totalInvested)} />
      <SummaryRow label="Wealth Gained" value={formatINR(wealthGained)} gain />
    </div>
  )
}

function SummaryRow({ label, value, accent, gain }: { label: string; value: string; accent?: boolean; gain?: boolean }) {
  return (
    <div style={styles.summaryRow}>
      <span style={styles.summaryLabel}>{label.toUpperCase()}</span>
      <span style={{
        ...styles.summaryValue,
        ...(accent ? { color: '#224c87', fontSize: 24, fontWeight: 700 } : {}),
        ...(gain ? { color: '#da3832' } : {}),
      }}>
        {value}
      </span>
    </div>
  )
}

const PIE_COLORS = ['#da3832', '#224c87']

/** Donut chart showing the split between invested principal and returns. */
function SIPPieChart({ totalInvested, wealthGained }: { totalInvested: number; wealthGained: number }) {
  const data = [
    { name: 'Invested', value: totalInvested },
    { name: 'Gains', value: wealthGained },
  ]
  return (
    <div style={styles.chartCard}>
      <p style={styles.chartTitle}>CORPUS BREAKDOWN</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={PIE_COLORS[index]} stroke="none" />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#919090' }}>
                {value}
              </span>
            )}
          />
          <Tooltip
            formatter={(value: number) => formatINR(value)}
            contentStyle={styles.tooltipStyle}
            labelStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Line chart plotting portfolio value vs. cumulative invested amount year by year. */
function SIPLineChart({ yearlyData }: { yearlyData: SIPResult['yearlyData'] }) {
  return (
    <div style={styles.chartCard}>
      <p style={styles.chartTitle}>YEAR-BY-YEAR PROJECTION</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={yearlyData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#F0F0F0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#919090' }}
            tickFormatter={(v) => `Y${v}`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#919090' }}
            tickFormatter={(v) => {
              if (v >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(1)}Cr`
              if (v >= 1_00_000) return `${(v / 1_00_000).toFixed(0)}L`
              return `${(v / 1000).toFixed(0)}K`
            }}
            width={52}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatINR(value), name === 'value' ? 'Portfolio Value' : 'Invested']}
            contentStyle={styles.tooltipStyle}
            labelFormatter={(label) => `Year ${label}`}
            labelStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#0D0D0D' }}
            itemStyle={{ fontFamily: 'IBM Plex Mono', fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="invested"
            stroke="#919090"
            strokeWidth={1.5}
            dot={false}
            name="invested"
            isAnimationActive
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#224c87"
            strokeWidth={2.5}
            dot={false}
            name="value"
            isAnimationActive
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={styles.lineChartLegend}>
        <span style={styles.legendDot('#919090')} /> <span style={styles.legendText}>Invested</span>
        <span style={{ ...styles.legendDot('#224c87'), marginLeft: 16 }} /> <span style={styles.legendText}>Portfolio Value</span>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────

const defaultInputs: SIPInputs = {
  monthlySIP: 10000,
  annualReturn: 12,
  years: 20,
}

export default function App() {
  const [inputs, setInputs] = useState<SIPInputs>(defaultInputs)
  const result = useSIPCalculator(inputs)

  function update<K extends keyof SIPInputs>(key: K, value: SIPInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.headerTitle}>SIP CALCULATOR</h1>
          <p style={styles.headerSub}>SYSTEMATIC INVESTMENT PLAN · PROJECTION TOOL</p>
        </div>
        <div style={styles.headerBottomRule} />
      </header>

      {/* Main layout */}
      <main style={styles.main} className="sip-main">
        {/* Left — Inputs */}
        <section style={styles.leftPanel}>
          <p style={styles.sectionLabel}>INPUTS</p>

          <SliderField
            label="Monthly SIP Amount"
            value={inputs.monthlySIP}
            onChange={v => update('monthlySIP', v)}
            min={500}
            max={100000}
            step={500}
            prefix="₹"
          />
          <SliderField
            label="Expected Annual Return"
            value={inputs.annualReturn}
            onChange={v => update('annualReturn', v)}
            min={1}
            max={30}
            step={0.5}
            suffix="%"
          />
          <SliderField
            label="Investment Duration"
            value={inputs.years}
            onChange={v => update('years', v)}
            min={1}
            max={40}
            step={1}
            suffix="yrs"
          />

          <SummaryCard
            finalValue={result.finalValue}
            totalInvested={result.totalInvested}
            wealthGained={result.wealthGained}
          />
        </section>

        {/* Divider */}
        <div style={styles.divider} className="sip-divider" />

        {/* Right — Charts */}
        <section style={styles.rightPanel}>
          <p style={styles.sectionLabel}>PROJECTIONS</p>
          <SIPPieChart totalInvested={result.totalInvested} wealthGained={result.wealthGained} />
          <SIPLineChart yearlyData={result.yearlyData} />
        </section>
      </main>

      <footer style={styles.footer}>
        <span>This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.</span>
      </footer>
    </div>
  )
}

// ── Styles (style objects) ─────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#FAFAFA',
    color: '#0D0D0D',
    borderTop: '4px solid #224c87',
  },
  header: {
    padding: '28px 40px 0',
  },
  headerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: '#0D0D0D',
    lineHeight: 1.1,
    marginBottom: 6,
  },
  headerSub: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 12,
    fontWeight: 400,
    color: '#919090',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  headerBottomRule: {
    borderBottom: '1px solid #E5E5E5',
  },
  main: {
    flex: 1,
    maxWidth: 1100,
    width: '100%',
    margin: '0 auto',
    padding: '32px 40px 40px',
    display: 'grid',
    gridTemplateColumns: '340px 1px 1fr',
    gap: '0 32px',
    alignItems: 'start',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
  },
  divider: {
    backgroundColor: '#E5E5E5',
    alignSelf: 'stretch',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 24,
  },
  sectionLabel: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 10,
    letterSpacing: '0.14em',
    color: '#919090',
    marginBottom: 20,
    textTransform: 'uppercase' as const,
  },
  inputGroup: {
    marginBottom: 24,
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  inputLabel: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 11,
    fontWeight: 400,
    color: '#919090',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
  sliderValueDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 3,
  },
  sliderNumber: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 20,
    fontWeight: 500,
    color: '#0D0D0D',
    fontVariantNumeric: 'tabular-nums',
  },
  inputAffix: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 13,
    fontWeight: 400,
    color: '#919090',
  },
  summaryCard: {
    marginTop: 28,
  },
  summaryRule: {
    height: 2,
    backgroundColor: '#224c87',
    marginBottom: 16,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottom: '1px solid #E5E5E5',
  },
  summaryLabel: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '0.07em',
    color: '#919090',
    textTransform: 'uppercase' as const,
  },
  summaryValue: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 16,
    fontWeight: 500,
    color: '#0D0D0D',
    fontVariantNumeric: 'tabular-nums',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    padding: '20px 20px 12px',
    border: '1px solid #E5E5E5',
  },
  chartTitle: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.14em',
    color: '#919090',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  },
  tooltipStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: 0,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 12,
    boxShadow: 'none',
    padding: '8px 12px',
  },
  lineChartLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingLeft: 8,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 11,
    color: '#919090',
  },
  legendText: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 11,
    color: '#919090',
  },
  legendDot: (color: string): React.CSSProperties => ({
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  }),
  footer: {
    borderTop: '1px solid #E5E5E5',
    padding: '14px 40px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 11,
    fontWeight: 400,
    color: '#919090',
    textAlign: 'center' as const,
  },
}
