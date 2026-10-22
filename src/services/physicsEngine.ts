import { PhysicsFormulaDefinition, StepSolution } from '../types';
import { formatNum } from './mathEngine';

export const PHYSICS_FORMULAS: PhysicsFormulaDefinition[] = [
  // 1. Speed, Distance & Time
  {
    id: 'speed_dist_time',
    category: 'Mechanics',
    name: 'Speed, Distance and Time',
    baseFormula: 'v = d / t',
    description: 'Calculates the uniform speed, distance covered, or time taken.',
    variables: [
      { symbol: 'v', name: 'Speed', unit: 'm/s', defaultValue: 12 },
      { symbol: 'd', name: 'Distance', unit: 'm', defaultValue: 120 },
      { symbol: 't', name: 'Time', unit: 's', defaultValue: 10 },
    ],
    solveFor: {
      v: {
        rearrangedFormula: 'v = d / t',
        unit: 'm/s',
        calculate: ({ d, t }) => {
          if (t === 0) throw new Error('Time cannot be zero.');
          const ans = d / t;
          return {
            result: ans,
            substitution: `v = ${d} / ${t}`,
            steps: [
              `Formula: v = d / t`,
              `Substitute known values: d = ${d} m, t = ${t} s`,
              `Compute: ${d} ÷ ${t} = ${formatNum(ans)} m/s`,
            ],
          };
        },
      },
      d: {
        rearrangedFormula: 'd = v × t',
        unit: 'm',
        calculate: ({ v, t }) => {
          const ans = v * t;
          return {
            result: ans,
            substitution: `d = ${v} × ${t}`,
            steps: [
              `Formula: d = v × t`,
              `Substitute: v = ${v} m/s, t = ${t} s`,
              `Compute: ${v} × ${t} = ${formatNum(ans)} m`,
            ],
          };
        },
      },
      t: {
        rearrangedFormula: 't = d / v',
        unit: 's',
        calculate: ({ d, v }) => {
          if (v === 0) throw new Error('Speed cannot be zero.');
          const ans = d / v;
          return {
            result: ans,
            substitution: `t = ${d} / ${v}`,
            steps: [
              `Formula: t = d / v`,
              `Substitute: d = ${d} m, v = ${v} m/s`,
              `Compute: ${d} ÷ ${v} = ${formatNum(ans)} s`,
            ],
          };
        },
      },
    },
  },

  // 2. Acceleration
  {
    id: 'acceleration',
    category: 'Mechanics',
    name: 'Acceleration',
    baseFormula: 'a = (v - u) / t',
    description: 'Rate of change of velocity with time.',
    variables: [
      { symbol: 'a', name: 'Acceleration', unit: 'm/s²', defaultValue: 3 },
      { symbol: 'v', name: 'Final Velocity', unit: 'm/s', defaultValue: 25 },
      { symbol: 'u', name: 'Initial Velocity', unit: 'm/s', defaultValue: 10 },
      { symbol: 't', name: 'Time taken', unit: 's', defaultValue: 5 },
    ],
    solveFor: {
      a: {
        rearrangedFormula: 'a = (v - u) / t',
        unit: 'm/s²',
        calculate: ({ v, u, t }) => {
          if (t === 0) throw new Error('Time cannot be zero.');
          const ans = (v - u) / t;
          return {
            result: ans,
            substitution: `a = (${v} - ${u}) / ${t}`,
            steps: [
              `Formula: a = (v - u) / t`,
              `Change in velocity Δv = ${v} - ${u} = ${v - u} m/s`,
              `Divide by time: (${v - u}) / ${t} = ${formatNum(ans)} m/s²`,
            ],
          };
        },
      },
      v: {
        rearrangedFormula: 'v = u + a × t',
        unit: 'm/s',
        calculate: ({ u, a, t }) => {
          const ans = u + a * t;
          return {
            result: ans,
            substitution: `v = ${u} + (${a} × ${t})`,
            steps: [
              `Formula: v = u + at`,
              `Multiply a × t: ${a} × ${t} = ${a * t}`,
              `Add initial velocity: ${u} + ${a * t} = ${formatNum(ans)} m/s`,
            ],
          };
        },
      },
      u: {
        rearrangedFormula: 'u = v - a × t',
        unit: 'm/s',
        calculate: ({ v, a, t }) => {
          const ans = v - a * t;
          return {
            result: ans,
            substitution: `u = ${v} - (${a} × ${t})`,
            steps: [
              `Formula: u = v - at`,
              `Multiply a × t: ${a} × ${t} = ${a * t}`,
              `Subtract from final velocity: ${v} - ${a * t} = ${formatNum(ans)} m/s`,
            ],
          };
        },
      },
      t: {
        rearrangedFormula: 't = (v - u) / a',
        unit: 's',
        calculate: ({ v, u, a }) => {
          if (a === 0) throw new Error('Acceleration cannot be zero.');
          const ans = (v - u) / a;
          return {
            result: ans,
            substitution: `t = (${v} - ${u}) / ${a}`,
            steps: [
              `Formula: t = (v - u) / a`,
              `Change in velocity = ${v} - ${u} = ${v - u} m/s`,
              `Divide by acceleration: (${v - u}) / ${a} = ${formatNum(ans)} s`,
            ],
          };
        },
      },
    },
  },

  // 3. Equations of Motion (Displacement: s = ut + 0.5 a t^2)
  {
    id: 'motion_s_ut_half_at2',
    category: 'Mechanics',
    name: 'Displacement (s = ut + ½at²)',
    baseFormula: 's = ut + ½at²',
    description: 'Calculates displacement given initial velocity, acceleration and time.',
    variables: [
      { symbol: 's', name: 'Displacement', unit: 'm', defaultValue: 100 },
      { symbol: 'u', name: 'Initial Velocity', unit: 'm/s', defaultValue: 5 },
      { symbol: 'a', name: 'Acceleration', unit: 'm/s²', defaultValue: 2 },
      { symbol: 't', name: 'Time', unit: 's', defaultValue: 8 },
    ],
    solveFor: {
      s: {
        rearrangedFormula: 's = ut + ½at²',
        unit: 'm',
        calculate: ({ u, a, t }) => {
          const term1 = u * t;
          const term2 = 0.5 * a * t * t;
          const ans = term1 + term2;
          return {
            result: ans,
            substitution: `s = (${u} × ${t}) + ½ × ${a} × (${t})²`,
            steps: [
              `Formula: s = ut + ½at²`,
              `term 1 (ut) = ${u} × ${t} = ${term1} m`,
              `term 2 (½at²) = 0.5 × ${a} × ${t * t} = ${term2} m`,
              `Sum = ${term1} + ${term2} = ${formatNum(ans)} m`,
            ],
          };
        },
      },
      u: {
        rearrangedFormula: 'u = (s - ½at²) / t',
        unit: 'm/s',
        calculate: ({ s, a, t }) => {
          if (t === 0) throw new Error('Time cannot be zero.');
          const ans = (s - 0.5 * a * t * t) / t;
          return {
            result: ans,
            substitution: `u = (${s} - ½ × ${a} × ${t}²) / ${t}`,
            steps: [
              `Rearrange: u = (s - ½at²) / t`,
              `Calculate ½at² = 0.5 × ${a} × ${t * t} = ${0.5 * a * t * t}`,
              `Subtract from s: ${s} - ${0.5 * a * t * t} = ${s - 0.5 * a * t * t}`,
              `Divide by t: (${s - 0.5 * a * t * t}) / ${t} = ${formatNum(ans)} m/s`,
            ],
          };
        },
      },
      a: {
        rearrangedFormula: 'a = 2(s - ut) / t²',
        unit: 'm/s²',
        calculate: ({ s, u, t }) => {
          if (t === 0) throw new Error('Time cannot be zero.');
          const ans = (2 * (s - u * t)) / (t * t);
          return {
            result: ans,
            substitution: `a = 2 × (${s} - ${u} × ${t}) / (${t}²)`,
            steps: [
              `Rearrange: a = 2(s - ut) / t²`,
              `ut = ${u} × ${t} = ${u * t}`,
              `s - ut = ${s} - ${u * t} = ${s - u * t}`,
              `Multiply by 2 and divide by t² (${t * t}): 2 × ${s - u * t} / ${t * t} = ${formatNum(ans)} m/s²`,
            ],
          };
        },
      },
    },
  },

  // 4. Equations of Motion (v^2 = u^2 + 2as)
  {
    id: 'motion_v2_u2_2as',
    category: 'Mechanics',
    name: 'Velocity-Displacement (v² = u² + 2as)',
    baseFormula: 'v² = u² + 2as',
    description: 'Relates velocities, acceleration and displacement independent of time.',
    variables: [
      { symbol: 'v', name: 'Final Velocity', unit: 'm/s', defaultValue: 20 },
      { symbol: 'u', name: 'Initial Velocity', unit: 'm/s', defaultValue: 0 },
      { symbol: 'a', name: 'Acceleration', unit: 'm/s²', defaultValue: 9.8 },
      { symbol: 's', name: 'Displacement', unit: 'm', defaultValue: 20.4 },
    ],
    solveFor: {
      v: {
        rearrangedFormula: 'v = √(u² + 2as)',
        unit: 'm/s',
        calculate: ({ u, a, s }) => {
          const val = u * u + 2 * a * s;
          if (val < 0) throw new Error('Value under square root is negative.');
          const ans = Math.sqrt(val);
          return {
            result: ans,
            substitution: `v = √(${u}² + 2 × ${a} × ${s})`,
            steps: [
              `Formula: v² = u² + 2as => v = √(u² + 2as)`,
              `u² = ${u * u}`,
              `2as = 2 × ${a} × ${s} = ${2 * a * s}`,
              `Sum = ${val}`,
              `v = √${val} = ${formatNum(ans)} m/s`,
            ],
          };
        },
      },
      u: {
        rearrangedFormula: 'u = √(v² - 2as)',
        unit: 'm/s',
        calculate: ({ v, a, s }) => {
          const val = v * v - 2 * a * s;
          if (val < 0) throw new Error('Value under square root is negative.');
          const ans = Math.sqrt(val);
          return {
            result: ans,
            substitution: `u = √(${v}² - 2 × ${a} × ${s})`,
            steps: [
              `Rearrange: u = √(v² - 2as)`,
              `v² = ${v * v}`,
              `2as = ${2 * a * s}`,
              `Difference = ${val}`,
              `u = √${val} = ${formatNum(ans)} m/s`,
            ],
          };
        },
      },
      a: {
        rearrangedFormula: 'a = (v² - u²) / (2s)',
        unit: 'm/s²',
        calculate: ({ v, u, s }) => {
          if (s === 0) throw new Error('Displacement cannot be zero.');
          const ans = (v * v - u * u) / (2 * s);
          return {
            result: ans,
            substitution: `a = (${v}² - ${u}²) / (2 × ${s})`,
            steps: [
              `Formula: a = (v² - u²) / (2s)`,
              `v² - u² = ${v * v} - ${u * u} = ${v * v - u * u}`,
              `Denominator 2s = 2 × ${s} = ${2 * s}`,
              `Divide: ${v * v - u * u} / ${2 * s} = ${formatNum(ans)} m/s²`,
            ],
          };
        },
      },
      s: {
        rearrangedFormula: 's = (v² - u²) / (2a)',
        unit: 'm',
        calculate: ({ v, u, a }) => {
          if (a === 0) throw new Error('Acceleration cannot be zero.');
          const ans = (v * v - u * u) / (2 * a);
          return {
            result: ans,
            substitution: `s = (${v}² - ${u}²) / (2 × ${a})`,
            steps: [
              `Formula: s = (v² - u²) / (2a)`,
              `v² - u² = ${v * v} - ${u * u} = ${v * v - u * u}`,
              `Denominator 2a = 2 × ${a} = ${2 * a}`,
              `Divide: ${v * v - u * u} / ${2 * a} = ${formatNum(ans)} m`,
            ],
          };
        },
      },
    },
  },

  // 5. Newton's Second Law: F = ma
  {
    id: 'newton_second_law',
    category: 'Mechanics',
    name: "Newton's Second Law (Force)",
    baseFormula: 'F = m × a',
    description: 'The net force acting on a body equals mass times acceleration.',
    variables: [
      { symbol: 'F', name: 'Force', unit: 'N', defaultValue: 50 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 10 },
      { symbol: 'a', name: 'Acceleration', unit: 'm/s²', defaultValue: 5 },
    ],
    solveFor: {
      F: {
        rearrangedFormula: 'F = m × a',
        unit: 'N',
        calculate: ({ m, a }) => {
          const ans = m * a;
          return {
            result: ans,
            substitution: `F = ${m} kg × ${a} m/s²`,
            steps: [
              `Formula: F = ma`,
              `Substitute mass m = ${m} kg, acceleration a = ${a} m/s²`,
              `Multiply: ${m} × ${a} = ${formatNum(ans)} N`,
            ],
          };
        },
      },
      m: {
        rearrangedFormula: 'm = F / a',
        unit: 'kg',
        calculate: ({ F, a }) => {
          if (a === 0) throw new Error('Acceleration cannot be zero.');
          const ans = F / a;
          return {
            result: ans,
            substitution: `m = ${F} / ${a}`,
            steps: [
              `Formula: m = F / a`,
              `Substitute F = ${F} N, a = ${a} m/s²`,
              `Divide: ${F} ÷ ${a} = ${formatNum(ans)} kg`,
            ],
          };
        },
      },
      a: {
        rearrangedFormula: 'a = F / m',
        unit: 'm/s²',
        calculate: ({ F, m }) => {
          if (m === 0) throw new Error('Mass cannot be zero.');
          const ans = F / m;
          return {
            result: ans,
            substitution: `a = ${F} / ${m}`,
            steps: [
              `Formula: a = F / m`,
              `Substitute F = ${F} N, m = ${m} kg`,
              `Divide: ${F} ÷ ${m} = ${formatNum(ans)} m/s²`,
            ],
          };
        },
      },
    },
  },

  // 6. Weight: W = mg
  {
    id: 'weight',
    category: 'Mechanics',
    name: 'Weight & Gravity (W = mg)',
    baseFormula: 'W = m × g',
    description: 'Gravitational attraction on an object of mass m.',
    variables: [
      { symbol: 'W', name: 'Weight', unit: 'N', defaultValue: 196 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 20 },
      { symbol: 'g', name: 'Gravitational Field Strength', unit: 'm/s²', defaultValue: 9.8 },
    ],
    solveFor: {
      W: {
        rearrangedFormula: 'W = m × g',
        unit: 'N',
        calculate: ({ m, g }) => {
          const ans = m * g;
          return {
            result: ans,
            substitution: `W = ${m} × ${g}`,
            steps: [
              `Formula: W = mg`,
              `Given mass m = ${m} kg and g = ${g} m/s² (or N/kg)`,
              `Compute: ${m} × ${g} = ${formatNum(ans)} N`,
            ],
          };
        },
      },
      m: {
        rearrangedFormula: 'm = W / g',
        unit: 'kg',
        calculate: ({ W, g }) => {
          if (g === 0) throw new Error('Gravity cannot be zero.');
          const ans = W / g;
          return {
            result: ans,
            substitution: `m = ${W} / ${g}`,
            steps: [`Formula: m = W / g`, `Compute: ${W} ÷ ${g} = ${formatNum(ans)} kg`],
          };
        },
      },
      g: {
        rearrangedFormula: 'g = W / m',
        unit: 'N/kg',
        calculate: ({ W, m }) => {
          if (m === 0) throw new Error('Mass cannot be zero.');
          const ans = W / m;
          return {
            result: ans,
            substitution: `g = ${W} / ${m}`,
            steps: [`Formula: g = W / m`, `Compute: ${W} ÷ ${m} = ${formatNum(ans)} N/kg`],
          };
        },
      },
    },
  },

  // 7. Momentum & Impulse
  {
    id: 'momentum',
    category: 'Mechanics',
    name: 'Linear Momentum (p = mv)',
    baseFormula: 'p = m × v',
    description: 'Product of mass and linear velocity.',
    variables: [
      { symbol: 'p', name: 'Momentum', unit: 'kg·m/s', defaultValue: 40 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 8 },
      { symbol: 'v', name: 'Velocity', unit: 'm/s', defaultValue: 5 },
    ],
    solveFor: {
      p: {
        rearrangedFormula: 'p = m × v',
        unit: 'kg·m/s',
        calculate: ({ m, v }) => ({
          result: m * v,
          substitution: `p = ${m} × ${v}`,
          steps: [`Formula: p = mv`, `Compute: ${m} × ${v} = ${formatNum(m * v)} kg·m/s`],
        }),
      },
      m: {
        rearrangedFormula: 'm = p / v',
        unit: 'kg',
        calculate: ({ p, v }) => {
          if (v === 0) throw new Error('Velocity cannot be zero.');
          return {
            result: p / v,
            substitution: `m = ${p} / ${v}`,
            steps: [`Formula: m = p / v`, `Compute: ${p} ÷ ${v} = ${formatNum(p / v)} kg`],
          };
        },
      },
      v: {
        rearrangedFormula: 'v = p / m',
        unit: 'm/s',
        calculate: ({ p, m }) => {
          if (m === 0) throw new Error('Mass cannot be zero.');
          return {
            result: p / m,
            substitution: `v = ${p} / ${m}`,
            steps: [`Formula: v = p / m`, `Compute: ${p} ÷ ${m} = ${formatNum(p / m)} m/s`],
          };
        },
      },
    },
  },

  // 8. Impulse: J = F * Δt
  {
    id: 'impulse',
    category: 'Mechanics',
    name: 'Impulse (J = FΔt)',
    baseFormula: 'J = F × Δt',
    description: 'Change in momentum resulting from a force acting over time.',
    variables: [
      { symbol: 'J', name: 'Impulse', unit: 'N·s', defaultValue: 100 },
      { symbol: 'F', name: 'Force', unit: 'N', defaultValue: 25 },
      { symbol: 't', name: 'Time interval', unit: 's', defaultValue: 4 },
    ],
    solveFor: {
      J: {
        rearrangedFormula: 'J = F × t',
        unit: 'N·s',
        calculate: ({ F, t }) => ({
          result: F * t,
          substitution: `J = ${F} × ${t}`,
          steps: [`Formula: J = F·Δt`, `Compute: ${F} × ${t} = ${formatNum(F * t)} N·s`],
        }),
      },
      F: {
        rearrangedFormula: 'F = J / t',
        unit: 'N',
        calculate: ({ J, t }) => {
          if (t === 0) throw new Error('Time cannot be zero.');
          return {
            result: J / t,
            substitution: `F = ${J} / ${t}`,
            steps: [`Formula: F = J / Δt`, `Compute: ${J} ÷ ${t} = ${formatNum(J / t)} N`],
          };
        },
      },
      t: {
        rearrangedFormula: 't = J / F',
        unit: 's',
        calculate: ({ J, F }) => {
          if (F === 0) throw new Error('Force cannot be zero.');
          return {
            result: J / F,
            substitution: `t = ${J} / ${F}`,
            steps: [`Formula: Δt = J / F`, `Compute: ${J} ÷ ${F} = ${formatNum(J / F)} s`],
          };
        },
      },
    },
  },

  // 9. Work, Energy & Power: Work = F * d * cos(theta)
  {
    id: 'work_done',
    category: 'Energy & Work',
    name: 'Work Done (W = F·d·cos θ)',
    baseFormula: 'W = F × d × cos(θ)',
    description: 'Work done by a force over displacement at angle θ.',
    variables: [
      { symbol: 'W', name: 'Work Done', unit: 'J', defaultValue: 200 },
      { symbol: 'F', name: 'Force', unit: 'N', defaultValue: 40 },
      { symbol: 'd', name: 'Displacement', unit: 'm', defaultValue: 5 },
      { symbol: 'theta', name: 'Angle θ (degrees)', unit: '°', defaultValue: 0 },
    ],
    solveFor: {
      W: {
        rearrangedFormula: 'W = F × d × cos(θ)',
        unit: 'J',
        calculate: ({ F, d, theta }) => {
          const rad = (theta * Math.PI) / 180;
          const cosVal = Math.cos(rad);
          const ans = F * d * cosVal;
          return {
            result: ans,
            substitution: `W = ${F} × ${d} × cos(${theta}°)`,
            steps: [
              `Formula: W = F·d·cos(θ)`,
              `cos(${theta}°) = ${formatNum(cosVal, 4)}`,
              `Compute: ${F} × ${d} × ${formatNum(cosVal, 4)} = ${formatNum(ans)} J`,
            ],
          };
        },
      },
      F: {
        rearrangedFormula: 'F = W / (d × cos θ)',
        unit: 'N',
        calculate: ({ W, d, theta }) => {
          const rad = (theta * Math.PI) / 180;
          const cosVal = Math.cos(rad);
          if (Math.abs(d * cosVal) < 1e-9) throw new Error('Division by zero (perpendicular force or zero distance).');
          const ans = W / (d * cosVal);
          return {
            result: ans,
            substitution: `F = ${W} / (${d} × cos(${theta}°))`,
            steps: [
              `Formula: F = W / (d·cos θ)`,
              `Denominator = ${d} × ${formatNum(cosVal, 4)} = ${formatNum(d * cosVal, 4)}`,
              `Compute: ${W} ÷ ${formatNum(d * cosVal, 4)} = ${formatNum(ans)} N`,
            ],
          };
        },
      },
    },
  },

  // 10. Kinetic Energy: KE = 0.5 * m * v^2
  {
    id: 'kinetic_energy',
    category: 'Energy & Work',
    name: 'Kinetic Energy (KE = ½mv²)',
    baseFormula: 'KE = ½ × m × v²',
    description: 'Energy possessed by an object due to its motion.',
    variables: [
      { symbol: 'KE', name: 'Kinetic Energy', unit: 'J', defaultValue: 250 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 5 },
      { symbol: 'v', name: 'Velocity', unit: 'm/s', defaultValue: 10 },
    ],
    solveFor: {
      KE: {
        rearrangedFormula: 'KE = ½ × m × v²',
        unit: 'J',
        calculate: ({ m, v }) => {
          const ans = 0.5 * m * v * v;
          return {
            result: ans,
            substitution: `KE = 0.5 × ${m} × (${v})²`,
            steps: [
              `Formula: KE = ½mv²`,
              `Square velocity: (${v})² = ${v * v}`,
              `Compute: 0.5 × ${m} × ${v * v} = ${formatNum(ans)} J`,
            ],
          };
        },
      },
      m: {
        rearrangedFormula: 'm = 2 × KE / v²',
        unit: 'kg',
        calculate: ({ KE, v }) => {
          if (v === 0) throw new Error('Velocity cannot be zero.');
          const ans = (2 * KE) / (v * v);
          return {
            result: ans,
            substitution: `m = (2 × ${KE}) / (${v}²)`,
            steps: [
              `Rearrange: m = 2·KE / v²`,
              `Compute numerator: 2 × ${KE} = ${2 * KE}`,
              `Compute denominator: ${v}² = ${v * v}`,
              `Divide: ${2 * KE} ÷ ${v * v} = ${formatNum(ans)} kg`,
            ],
          };
        },
      },
      v: {
        rearrangedFormula: 'v = √(2 × KE / m)',
        unit: 'm/s',
        calculate: ({ KE, m }) => {
          if (m <= 0) throw new Error('Mass must be positive.');
          const ans = Math.sqrt((2 * KE) / m);
          return {
            result: ans,
            substitution: `v = √( (2 × ${KE}) / ${m} )`,
            steps: [
              `Rearrange: v = √(2·KE / m)`,
              `2·KE = 2 × ${KE} = ${2 * KE}`,
              `Divide by mass: ${2 * KE} ÷ ${m} = ${(2 * KE) / m}`,
              `Take square root: √${(2 * KE) / m} = ${formatNum(ans)} m/s`,
            ],
          };
        },
      },
    },
  },

  // 11. Potential Energy: PE = mgh
  {
    id: 'potential_energy',
    category: 'Energy & Work',
    name: 'Gravitational Potential Energy (PE = mgh)',
    baseFormula: 'PE = m × g × h',
    description: 'Energy stored in an object due to its vertical position.',
    variables: [
      { symbol: 'PE', name: 'Potential Energy', unit: 'J', defaultValue: 490 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 10 },
      { symbol: 'g', name: 'Gravity', unit: 'm/s²', defaultValue: 9.8 },
      { symbol: 'h', name: 'Height', unit: 'm', defaultValue: 5 },
    ],
    solveFor: {
      PE: {
        rearrangedFormula: 'PE = m × g × h',
        unit: 'J',
        calculate: ({ m, g, h }) => ({
          result: m * g * h,
          substitution: `PE = ${m} × ${g} × ${h}`,
          steps: [`Formula: PE = mgh`, `Compute: ${m} × ${g} × ${h} = ${formatNum(m * g * h)} J`],
        }),
      },
      h: {
        rearrangedFormula: 'h = PE / (m × g)',
        unit: 'm',
        calculate: ({ PE, m, g }) => {
          const denom = m * g;
          if (denom === 0) throw new Error('m * g cannot be zero.');
          return {
            result: PE / denom,
            substitution: `h = ${PE} / (${m} × ${g})`,
            steps: [`Formula: h = PE / (mg)`, `Compute: ${PE} ÷ (${m} × ${g}) = ${formatNum(PE / denom)} m`],
          };
        },
      },
      m: {
        rearrangedFormula: 'm = PE / (g × h)',
        unit: 'kg',
        calculate: ({ PE, g, h }) => {
          const denom = g * h;
          if (denom === 0) throw new Error('g * h cannot be zero.');
          return {
            result: PE / denom,
            substitution: `m = ${PE} / (${g} × ${h})`,
            steps: [`Formula: m = PE / (gh)`, `Compute: ${PE} ÷ (${g} × ${h}) = ${formatNum(PE / denom)} kg`],
          };
        },
      },
    },
  },

  // 12. Power: P = W / t
  {
    id: 'power',
    category: 'Energy & Work',
    name: 'Power (P = W / t)',
    baseFormula: 'P = W / t',
    description: 'Rate of doing work or transferring energy.',
    variables: [
      { symbol: 'P', name: 'Power', unit: 'W', defaultValue: 100 },
      { symbol: 'W', name: 'Work / Energy', unit: 'J', defaultValue: 500 },
      { symbol: 't', name: 'Time', unit: 's', defaultValue: 5 },
    ],
    solveFor: {
      P: {
        rearrangedFormula: 'P = W / t',
        unit: 'W',
        calculate: ({ W, t }) => {
          if (t === 0) throw new Error('Time cannot be zero.');
          return {
            result: W / t,
            substitution: `P = ${W} / ${t}`,
            steps: [`Formula: P = W / t`, `Compute: ${W} ÷ ${t} = ${formatNum(W / t)} W (Watts)`],
          };
        },
      },
      W: {
        rearrangedFormula: 'W = P × t',
        unit: 'J',
        calculate: ({ P, t }) => ({
          result: P * t,
          substitution: `W = ${P} × ${t}`,
          steps: [`Formula: W = P × t`, `Compute: ${P} × ${t} = ${formatNum(P * t)} J`],
        }),
      },
      t: {
        rearrangedFormula: 't = W / P',
        unit: 's',
        calculate: ({ W, P }) => {
          if (P === 0) throw new Error('Power cannot be zero.');
          return {
            result: W / P,
            substitution: `t = ${W} / ${P}`,
            steps: [`Formula: t = W / P`, `Compute: ${W} ÷ ${P} = ${formatNum(W / P)} s`],
          };
        },
      },
    },
  },

  // 13. Pressure: P = F / A
  {
    id: 'pressure',
    category: 'Fluids & Pressure',
    name: 'Pressure (P = F / A)',
    baseFormula: 'P = F / A',
    description: 'Force applied perpendicular to a surface per unit area.',
    variables: [
      { symbol: 'P', name: 'Pressure', unit: 'Pa (N/m²)', defaultValue: 2500 },
      { symbol: 'F', name: 'Force', unit: 'N', defaultValue: 500 },
      { symbol: 'A', name: 'Area', unit: 'm²', defaultValue: 0.2 },
    ],
    solveFor: {
      P: {
        rearrangedFormula: 'P = F / A',
        unit: 'Pa',
        calculate: ({ F, A }) => {
          if (A === 0) throw new Error('Area cannot be zero.');
          return {
            result: F / A,
            substitution: `P = ${F} / ${A}`,
            steps: [`Formula: P = F / A`, `Compute: ${F} ÷ ${A} = ${formatNum(F / A)} Pa (N/m²)`],
          };
        },
      },
      F: {
        rearrangedFormula: 'F = P × A',
        unit: 'N',
        calculate: ({ P, A }) => ({
          result: P * A,
          substitution: `F = ${P} × ${A}`,
          steps: [`Formula: F = P × A`, `Compute: ${P} × ${A} = ${formatNum(P * A)} N`],
        }),
      },
      A: {
        rearrangedFormula: 'A = F / P',
        unit: 'm²',
        calculate: ({ F, P }) => {
          if (P === 0) throw new Error('Pressure cannot be zero.');
          return {
            result: F / P,
            substitution: `A = ${F} / ${P}`,
            steps: [`Formula: A = F / P`, `Compute: ${F} ÷ ${P} = ${formatNum(F / P)} m²`],
          };
        },
      },
    },
  },

  // 14. Density: ρ = m / V
  {
    id: 'density',
    category: 'Fluids & Pressure',
    name: 'Density (ρ = m / V)',
    baseFormula: 'ρ = m / V',
    description: 'Mass per unit volume of a substance.',
    variables: [
      { symbol: 'rho', name: 'Density (ρ)', unit: 'kg/m³', defaultValue: 1000 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 50 },
      { symbol: 'V', name: 'Volume', unit: 'm³', defaultValue: 0.05 },
    ],
    solveFor: {
      rho: {
        rearrangedFormula: 'ρ = m / V',
        unit: 'kg/m³',
        calculate: ({ m, V }) => {
          if (V === 0) throw new Error('Volume cannot be zero.');
          return {
            result: m / V,
            substitution: `ρ = ${m} / ${V}`,
            steps: [`Formula: ρ = m / V`, `Compute: ${m} ÷ ${V} = ${formatNum(m / V)} kg/m³`],
          };
        },
      },
      m: {
        rearrangedFormula: 'm = ρ × V',
        unit: 'kg',
        calculate: ({ rho, V }) => ({
          result: rho * V,
          substitution: `m = ${rho} × ${V}`,
          steps: [`Formula: m = ρ × V`, `Compute: ${rho} × ${V} = ${formatNum(rho * V)} kg`],
        }),
      },
      V: {
        rearrangedFormula: 'V = m / ρ',
        unit: 'm³',
        calculate: ({ m, rho }) => {
          if (rho === 0) throw new Error('Density cannot be zero.');
          return {
            result: m / rho,
            substitution: `V = ${m} / ${rho}`,
            steps: [`Formula: V = m / ρ`, `Compute: ${m} ÷ ${rho} = ${formatNum(m / rho)} m³`],
          };
        },
      },
    },
  },

  // 15. Upthrust / Archimedes Principle: U = ρ * V * g
  {
    id: 'upthrust',
    category: 'Fluids & Pressure',
    name: 'Upthrust (Archimedes Principle)',
    baseFormula: 'U = ρ × V × g',
    description: 'Upward buoyant force exerted on a body immersed in a fluid.',
    variables: [
      { symbol: 'U', name: 'Upthrust', unit: 'N', defaultValue: 98 },
      { symbol: 'rho', name: 'Fluid Density', unit: 'kg/m³', defaultValue: 1000 },
      { symbol: 'V', name: 'Submerged Volume', unit: 'm³', defaultValue: 0.01 },
      { symbol: 'g', name: 'Gravity', unit: 'm/s²', defaultValue: 9.8 },
    ],
    solveFor: {
      U: {
        rearrangedFormula: 'U = ρ × V × g',
        unit: 'N',
        calculate: ({ rho, V, g }) => ({
          result: rho * V * g,
          substitution: `U = ${rho} × ${V} × ${g}`,
          steps: [
            `Formula: U = ρVg`,
            `Fluid density ρ = ${rho} kg/m³`,
            `Displaced volume V = ${V} m³`,
            `Multiply: ${rho} × ${V} × ${g} = ${formatNum(rho * V * g)} N`,
          ],
        }),
      },
      V: {
        rearrangedFormula: 'V = U / (ρ × g)',
        unit: 'm³',
        calculate: ({ U, rho, g }) => {
          const denom = rho * g;
          return {
            result: U / denom,
            substitution: `V = ${U} / (${rho} × ${g})`,
            steps: [`Formula: V = U / (ρg)`, `Compute: ${U} ÷ (${rho} × ${g}) = ${formatNum(U / denom)} m³`],
          };
        },
      },
    },
  },

  // 16. Simple Machines: MA, VR, Efficiency
  {
    id: 'simple_machines',
    category: 'Machines',
    name: 'Simple Machines (MA, VR & Efficiency)',
    baseFormula: 'η = (MA / VR) × 100%',
    description: 'Mechanical Advantage, Velocity Ratio, and percentage efficiency.',
    variables: [
      { symbol: 'load', name: 'Load (L)', unit: 'N', defaultValue: 500 },
      { symbol: 'effort', name: 'Effort (E)', unit: 'N', defaultValue: 125 },
      { symbol: 'distEffort', name: 'Effort Distance (dE)', unit: 'm', defaultValue: 5 },
      { symbol: 'distLoad', name: 'Load Distance (dL)', unit: 'm', defaultValue: 1 },
    ],
    solveFor: {
      efficiency: {
        rearrangedFormula: 'η = (MA / VR) × 100% = [(L/E) / (dE/dL)] × 100%',
        unit: '%',
        calculate: ({ load, effort, distEffort, distLoad }) => {
          if (effort === 0 || distLoad === 0) throw new Error('Effort and Load distance must be non-zero.');
          const MA = load / effort;
          const VR = distEffort / distLoad;
          const eff = (MA / VR) * 100;
          return {
            result: eff,
            substitution: `MA = ${load}/${effort} = ${MA}, VR = ${distEffort}/${distLoad} = ${VR}`,
            steps: [
              `Mechanical Advantage MA = Load / Effort = ${load} ÷ ${effort} = ${formatNum(MA, 4)}`,
              `Velocity Ratio VR = Distance_effort / Distance_load = ${distEffort} ÷ ${distLoad} = ${formatNum(VR, 4)}`,
              `Efficiency η = (MA / VR) × 100%`,
              `η = (${formatNum(MA, 4)} / ${formatNum(VR, 4)}) × 100% = ${formatNum(eff, 2)}%`,
            ],
          };
        },
      },
    },
  },

  // 17. Heat: Q = mcΔT
  {
    id: 'heat_capacity',
    category: 'Thermal Physics',
    name: 'Specific Heat Capacity (Q = mcΔT)',
    baseFormula: 'Q = m × c × ΔT',
    description: 'Heat energy absorbed or released during temperature change.',
    variables: [
      { symbol: 'Q', name: 'Heat Energy', unit: 'J', defaultValue: 42000 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 1 },
      { symbol: 'c', name: 'Specific Heat Capacity', unit: 'J/(kg·K)', defaultValue: 4200 },
      { symbol: 'deltaT', name: 'Temperature change (ΔT)', unit: '°C or K', defaultValue: 10 },
    ],
    solveFor: {
      Q: {
        rearrangedFormula: 'Q = m × c × ΔT',
        unit: 'J',
        calculate: ({ m, c, deltaT }) => ({
          result: m * c * deltaT,
          substitution: `Q = ${m} × ${c} × ${deltaT}`,
          steps: [`Formula: Q = mcΔT`, `Compute: ${m} × ${c} × ${deltaT} = ${formatNum(m * c * deltaT)} J`],
        }),
      },
      c: {
        rearrangedFormula: 'c = Q / (m × ΔT)',
        unit: 'J/(kg·K)',
        calculate: ({ Q, m, deltaT }) => {
          const denom = m * deltaT;
          if (denom === 0) throw new Error('m * ΔT cannot be zero.');
          return {
            result: Q / denom,
            substitution: `c = ${Q} / (${m} × ${deltaT})`,
            steps: [`Formula: c = Q / (m·ΔT)`, `Compute: ${Q} ÷ (${m} × ${deltaT}) = ${formatNum(Q / denom)} J/(kg·K)`],
          };
        },
      },
      deltaT: {
        rearrangedFormula: 'ΔT = Q / (m × c)',
        unit: 'K',
        calculate: ({ Q, m, c }) => {
          const denom = m * c;
          if (denom === 0) throw new Error('m * c cannot be zero.');
          return {
            result: Q / denom,
            substitution: `ΔT = ${Q} / (${m} × ${c})`,
            steps: [`Formula: ΔT = Q / (mc)`, `Compute: ${Q} ÷ (${m} × ${c}) = ${formatNum(Q / denom)} K (or °C)`],
          };
        },
      },
    },
  },

  // 18. Latent Heat: Q = mL
  {
    id: 'latent_heat',
    category: 'Thermal Physics',
    name: 'Latent Heat (Q = mL)',
    baseFormula: 'Q = m × L',
    description: 'Heat absorbed or released during a phase change at constant temperature.',
    variables: [
      { symbol: 'Q', name: 'Heat Energy', unit: 'J', defaultValue: 67200 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 0.2 },
      { symbol: 'L', name: 'Specific Latent Heat', unit: 'J/kg', defaultValue: 336000 },
    ],
    solveFor: {
      Q: {
        rearrangedFormula: 'Q = m × L',
        unit: 'J',
        calculate: ({ m, L }) => ({
          result: m * L,
          substitution: `Q = ${m} × ${L}`,
          steps: [`Formula: Q = mL`, `Compute: ${m} × ${L} = ${formatNum(m * L)} J`],
        }),
      },
      m: {
        rearrangedFormula: 'm = Q / L',
        unit: 'kg',
        calculate: ({ Q, L }) => {
          if (L === 0) throw new Error('Latent heat cannot be zero.');
          return {
            result: Q / L,
            substitution: `m = ${Q} / ${L}`,
            steps: [`Formula: m = Q / L`, `Compute: ${Q} ÷ ${L} = ${formatNum(Q / L)} kg`],
          };
        },
      },
      L: {
        rearrangedFormula: 'L = Q / m',
        unit: 'J/kg',
        calculate: ({ Q, m }) => {
          if (m === 0) throw new Error('Mass cannot be zero.');
          return {
            result: Q / m,
            substitution: `L = ${Q} / ${m}`,
            steps: [`Formula: L = Q / m`, `Compute: ${Q} ÷ ${m} = ${formatNum(Q / m)} J/kg`],
          };
        },
      },
    },
  },

  // 19. Gas Laws: Boyle's Law: P1*V1 = P2*V2
  {
    id: 'boyles_law',
    category: 'Thermal Physics',
    name: "Boyle's Law (P₁V₁ = P₂V₂)",
    baseFormula: 'P₁ × V₁ = P₂ × V₂',
    description: 'At constant temperature, pressure and volume are inversely proportional.',
    variables: [
      { symbol: 'P1', name: 'Initial Pressure (P₁)', unit: 'Pa', defaultValue: 100000 },
      { symbol: 'V1', name: 'Initial Volume (V₁)', unit: 'm³', defaultValue: 2 },
      { symbol: 'P2', name: 'Final Pressure (P₂)', unit: 'Pa', defaultValue: 200000 },
      { symbol: 'V2', name: 'Final Volume (V₂)', unit: 'm³', defaultValue: 1 },
    ],
    solveFor: {
      V2: {
        rearrangedFormula: 'V₂ = (P₁ × V₁) / P₂',
        unit: 'm³',
        calculate: ({ P1, V1, P2 }) => {
          if (P2 === 0) throw new Error('Final pressure cannot be zero.');
          const ans = (P1 * V1) / P2;
          return {
            result: ans,
            substitution: `V₂ = (${P1} × ${V1}) / ${P2}`,
            steps: [`Formula: V₂ = (P₁V₁) / P₂`, `Numerator: ${P1} × ${V1} = ${P1 * V1}`, `Compute: ${P1 * V1} ÷ ${P2} = ${formatNum(ans)} m³`],
          };
        },
      },
      P2: {
        rearrangedFormula: 'P₂ = (P₁ × V₁) / V₂',
        unit: 'Pa',
        calculate: ({ P1, V1, V2 }) => {
          if (V2 === 0) throw new Error('Final volume cannot be zero.');
          const ans = (P1 * V1) / V2;
          return {
            result: ans,
            substitution: `P₂ = (${P1} × ${V1}) / ${V2}`,
            steps: [`Formula: P₂ = (P₁V₁) / V₂`, `Compute: (${P1} × ${V1}) ÷ ${V2} = ${formatNum(ans)} Pa`],
          };
        },
      },
    },
  },

  // 20. Waves & Sound: v = f * lambda
  {
    id: 'wave_equation',
    category: 'Waves & Sound',
    name: 'Wave Speed (v = fλ)',
    baseFormula: 'v = f × λ',
    description: 'Relationship between wave speed, frequency, and wavelength.',
    variables: [
      { symbol: 'v', name: 'Wave Speed', unit: 'm/s', defaultValue: 340 },
      { symbol: 'f', name: 'Frequency', unit: 'Hz', defaultValue: 170 },
      { symbol: 'lambda', name: 'Wavelength (λ)', unit: 'm', defaultValue: 2 },
    ],
    solveFor: {
      v: {
        rearrangedFormula: 'v = f × λ',
        unit: 'm/s',
        calculate: ({ f, lambda }) => ({
          result: f * lambda,
          substitution: `v = ${f} × ${lambda}`,
          steps: [`Formula: v = fλ`, `Compute: ${f} × ${lambda} = ${formatNum(f * lambda)} m/s`],
        }),
      },
      f: {
        rearrangedFormula: 'f = v / λ',
        unit: 'Hz',
        calculate: ({ v, lambda }) => {
          if (lambda === 0) throw new Error('Wavelength cannot be zero.');
          return {
            result: v / lambda,
            substitution: `f = ${v} / ${lambda}`,
            steps: [`Formula: f = v / λ`, `Compute: ${v} ÷ ${lambda} = ${formatNum(v / lambda)} Hz`],
          };
        },
      },
      lambda: {
        rearrangedFormula: 'λ = v / f',
        unit: 'm',
        calculate: ({ v, f }) => {
          if (f === 0) throw new Error('Frequency cannot be zero.');
          return {
            result: v / f,
            substitution: `λ = ${v} / ${f}`,
            steps: [`Formula: λ = v / f`, `Compute: ${v} ÷ ${f} = ${formatNum(v / f)} m`],
          };
        },
      },
    },
  },

  // 21. Electricity: Ohm's Law (V = IR)
  {
    id: 'ohms_law',
    category: 'Electricity & Magnetism',
    name: "Ohm's Law (V = IR)",
    baseFormula: 'V = I × R',
    description: 'Voltage across a conductor is proportional to current.',
    variables: [
      { symbol: 'V', name: 'Voltage', unit: 'V', defaultValue: 220 },
      { symbol: 'I', name: 'Current', unit: 'A', defaultValue: 5 },
      { symbol: 'R', name: 'Resistance', unit: 'Ω', defaultValue: 44 },
    ],
    solveFor: {
      V: {
        rearrangedFormula: 'V = I × R',
        unit: 'V',
        calculate: ({ I, R }) => ({
          result: I * R,
          substitution: `V = ${I} × ${R}`,
          steps: [`Formula: V = IR`, `Compute: ${I} A × ${R} Ω = ${formatNum(I * R)} V`],
        }),
      },
      I: {
        rearrangedFormula: 'I = V / R',
        unit: 'A',
        calculate: ({ V, R }) => {
          if (R === 0) throw new Error('Resistance cannot be zero.');
          return {
            result: V / R,
            substitution: `I = ${V} / ${R}`,
            steps: [`Formula: I = V / R`, `Compute: ${V} ÷ ${R} = ${formatNum(V / R)} A`],
          };
        },
      },
      R: {
        rearrangedFormula: 'R = V / I',
        unit: 'Ω',
        calculate: ({ V, I }) => {
          if (I === 0) throw new Error('Current cannot be zero.');
          return {
            result: V / I,
            substitution: `R = ${V} / ${I}`,
            steps: [`Formula: R = V / I`, `Compute: ${V} ÷ ${I} = ${formatNum(V / I)} Ω`],
          };
        },
      },
    },
  },

  // 22. Electrical Power: P = IV
  {
    id: 'electrical_power',
    category: 'Electricity & Magnetism',
    name: 'Electrical Power (P = IV)',
    baseFormula: 'P = I × V = I²R = V² / R',
    description: 'Rate of electrical energy transfer.',
    variables: [
      { symbol: 'P', name: 'Electrical Power', unit: 'W', defaultValue: 1100 },
      { symbol: 'I', name: 'Current', unit: 'A', defaultValue: 5 },
      { symbol: 'V', name: 'Voltage', unit: 'V', defaultValue: 220 },
    ],
    solveFor: {
      P: {
        rearrangedFormula: 'P = I × V',
        unit: 'W',
        calculate: ({ I, V }) => ({
          result: I * V,
          substitution: `P = ${I} × ${V}`,
          steps: [`Formula: P = IV`, `Compute: ${I} A × ${V} V = ${formatNum(I * V)} W`],
        }),
      },
      I: {
        rearrangedFormula: 'I = P / V',
        unit: 'A',
        calculate: ({ P, V }) => {
          if (V === 0) throw new Error('Voltage cannot be zero.');
          return {
            result: P / V,
            substitution: `I = ${P} / ${V}`,
            steps: [`Formula: I = P / V`, `Compute: ${P} ÷ ${V} = ${formatNum(P / V)} A`],
          };
        },
      },
      V: {
        rearrangedFormula: 'V = P / I',
        unit: 'V',
        calculate: ({ P, I }) => {
          if (I === 0) throw new Error('Current cannot be zero.');
          return {
            result: P / I,
            substitution: `V = ${P} / ${I}`,
            steps: [`Formula: V = P / I`, `Compute: ${P} ÷ ${I} = ${formatNum(P / I)} V`],
          };
        },
      },
    },
  },

  // 23. Capacitance: C = Q / V
  {
    id: 'capacitance',
    category: 'Electricity & Magnetism',
    name: 'Capacitance (C = Q / V)',
    baseFormula: 'C = Q / V',
    description: 'Ability of a system to store an electric charge.',
    variables: [
      { symbol: 'C', name: 'Capacitance', unit: 'F', defaultValue: 0.00005 },
      { symbol: 'Q', name: 'Charge', unit: 'C', defaultValue: 0.005 },
      { symbol: 'V', name: 'Voltage', unit: 'V', defaultValue: 100 },
    ],
    solveFor: {
      C: {
        rearrangedFormula: 'C = Q / V',
        unit: 'F',
        calculate: ({ Q, V }) => {
          if (V === 0) throw new Error('Voltage cannot be zero.');
          return {
            result: Q / V,
            substitution: `C = ${Q} / ${V}`,
            steps: [`Formula: C = Q / V`, `Compute: ${Q} ÷ ${V} = ${formatNum(Q / V, 6)} F (or ${formatNum((Q / V) * 1e6, 2)} µF)`],
          };
        },
      },
      Q: {
        rearrangedFormula: 'Q = C × V',
        unit: 'C',
        calculate: ({ C, V }) => ({
          result: C * V,
          substitution: `Q = ${C} × ${V}`,
          steps: [`Formula: Q = C × V`, `Compute: ${C} × ${V} = ${formatNum(C * V, 6)} C`],
        }),
      },
      V: {
        rearrangedFormula: 'V = Q / C',
        unit: 'V',
        calculate: ({ Q, C }) => {
          if (C === 0) throw new Error('Capacitance cannot be zero.');
          return {
            result: Q / C,
            substitution: `V = ${Q} / ${C}`,
            steps: [`Formula: V = Q / C`, `Compute: ${Q} ÷ ${C} = ${formatNum(Q / C)} V`],
          };
        },
      },
    },
  },

  // 24. Light & Refraction: Snell's Law (n = sin i / sin r)
  {
    id: 'snells_law',
    category: 'Optics',
    name: "Refraction & Snell's Law (n = sin i / sin r)",
    baseFormula: 'n = sin(i) / sin(r)',
    description: 'Refractive index calculated from angle of incidence and angle of refraction.',
    variables: [
      { symbol: 'n', name: 'Refractive Index', unit: '', defaultValue: 1.5 },
      { symbol: 'i', name: 'Angle of Incidence (i)', unit: '°', defaultValue: 45 },
      { symbol: 'r', name: 'Angle of Refraction (r)', unit: '°', defaultValue: 28.13 },
    ],
    solveFor: {
      n: {
        rearrangedFormula: 'n = sin(i) / sin(r)',
        unit: '',
        calculate: ({ i, r }) => {
          const sini = Math.sin((i * Math.PI) / 180);
          const sinr = Math.sin((r * Math.PI) / 180);
          if (Math.abs(sinr) < 1e-9) throw new Error('sin(r) cannot be zero.');
          const ans = sini / sinr;
          return {
            result: ans,
            substitution: `n = sin(${i}°) / sin(${r}°)`,
            steps: [
              `Formula: n = sin(i) / sin(r)`,
              `sin(${i}°) = ${formatNum(sini, 4)}`,
              `sin(${r}°) = ${formatNum(sinr, 4)}`,
              `Compute: ${formatNum(sini, 4)} ÷ ${formatNum(sinr, 4)} = ${formatNum(ans, 4)}`,
            ],
          };
        },
      },
      r: {
        rearrangedFormula: 'r = arcsin( sin(i) / n )',
        unit: '°',
        calculate: ({ i, n }) => {
          if (n === 0) throw new Error('Refractive index cannot be zero.');
          const sini = Math.sin((i * Math.PI) / 180);
          const sinr = sini / n;
          if (sinr > 1 || sinr < -1) throw new Error('Total internal reflection occurs.');
          const ans = (Math.asin(sinr) * 180) / Math.PI;
          return {
            result: ans,
            substitution: `r = arcsin( sin(${i}°) / ${n} )`,
            steps: [
              `Rearrange: sin(r) = sin(i) / n`,
              `sin(${i}°) / ${n} = ${formatNum(sinr, 4)}`,
              `r = arcsin(${formatNum(sinr, 4)}) = ${formatNum(ans, 2)}°`,
            ],
          };
        },
      },
    },
  },

  // 25. Lens and Mirror Formula: 1/f = 1/u + 1/v
  {
    id: 'lens_formula',
    category: 'Optics',
    name: 'Lens & Mirror Formula (1/f = 1/u + 1/v)',
    baseFormula: '1/f = 1/u + 1/v',
    description: 'Relates focal length f, object distance u, and image distance v.',
    variables: [
      { symbol: 'f', name: 'Focal Length (f)', unit: 'cm', defaultValue: 10 },
      { symbol: 'u', name: 'Object Distance (u)', unit: 'cm', defaultValue: 15 },
      { symbol: 'v', name: 'Image Distance (v)', unit: 'cm', defaultValue: 30 },
    ],
    solveFor: {
      f: {
        rearrangedFormula: 'f = (u × v) / (u + v)',
        unit: 'cm',
        calculate: ({ u, v }) => {
          const sum = u + v;
          if (sum === 0) throw new Error('u + v cannot be zero.');
          const ans = (u * v) / sum;
          return {
            result: ans,
            substitution: `f = (${u} × ${v}) / (${u} + ${v})`,
            steps: [
              `Formula: 1/f = 1/u + 1/v = (u + v)/(uv) => f = (uv)/(u + v)`,
              `Numerator: ${u} × ${v} = ${u * v}`,
              `Denominator: ${u} + ${v} = ${sum}`,
              `Compute: ${u * v} ÷ ${sum} = ${formatNum(ans, 3)} cm`,
            ],
          };
        },
      },
      v: {
        rearrangedFormula: 'v = (u × f) / (u - f)',
        unit: 'cm',
        calculate: ({ u, f }) => {
          const diff = u - f;
          if (diff === 0) throw new Error('Object placed at principal focus (image formed at infinity).');
          const ans = (u * f) / diff;
          const mag = Math.abs(ans / u);
          return {
            result: ans,
            substitution: `v = (${u} × ${f}) / (${u} - ${f})`,
            steps: [
              `Rearrange: 1/v = 1/f - 1/u = (u - f)/(uf) => v = (uf)/(u - f)`,
              `Numerator: ${u} × ${f} = ${u * f}`,
              `Denominator: ${u} - ${f} = ${diff}`,
              `v = ${u * f} ÷ ${diff} = ${formatNum(ans, 3)} cm`,
              `Linear Magnification m = |v/u| = |${formatNum(ans, 2)} / ${u}| = ${formatNum(mag, 3)}`,
            ],
          };
        },
      },
    },
  },

  // 26. Projectile Motion
  {
    id: 'projectile_motion',
    category: 'Modern & Advanced',
    name: 'Projectile Motion',
    baseFormula: 'Range = (u² sin 2θ) / g',
    description: 'Time of flight, maximum height, and horizontal range of a projectile.',
    variables: [
      { symbol: 'u', name: 'Launch Velocity (u)', unit: 'm/s', defaultValue: 30 },
      { symbol: 'theta', name: 'Launch Angle (θ)', unit: '°', defaultValue: 45 },
      { symbol: 'g', name: 'Gravity (g)', unit: 'm/s²', defaultValue: 9.8 },
    ],
    solveFor: {
      range: {
        rearrangedFormula: 'R = (u² × sin 2θ) / g',
        unit: 'm',
        calculate: ({ u, theta, g }) => {
          const rad = (theta * Math.PI) / 180;
          const sinTheta = Math.sin(rad);
          const sin2Theta = Math.sin(2 * rad);
          const T = (2 * u * sinTheta) / g;
          const H = (u * u * sinTheta * sinTheta) / (2 * g);
          const R = (u * u * sin2Theta) / g;
          return {
            result: R,
            substitution: `R = (${u}² × sin(2 × ${theta}°)) / ${g}`,
            steps: [
              `1. Time of Flight: T = (2u sin θ)/g = (2 × ${u} × ${formatNum(sinTheta, 4)}) / ${g} = ${formatNum(T, 3)} s`,
              `2. Maximum Height: H = (u² sin² θ)/(2g) = (${u * u} × ${formatNum(sinTheta * sinTheta, 4)}) / (${2 * g}) = ${formatNum(H, 3)} m`,
              `3. Horizontal Range: R = (u² sin 2θ)/g = (${u * u} × ${formatNum(sin2Theta, 4)}) / ${g} = ${formatNum(R, 3)} m`,
            ],
          };
        },
      },
    },
  },

  // 27. Circular Motion: Centripetal Force (F = m * v^2 / r)
  {
    id: 'centripetal_force',
    category: 'Mechanics',
    name: 'Centripetal Force (F = mv² / r)',
    baseFormula: 'F = (m × v²) / r',
    description: 'Inward force required to maintain circular motion.',
    variables: [
      { symbol: 'F', name: 'Centripetal Force', unit: 'N', defaultValue: 100 },
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 2 },
      { symbol: 'v', name: 'Speed', unit: 'm/s', defaultValue: 10 },
      { symbol: 'r', name: 'Radius', unit: 'm', defaultValue: 2 },
    ],
    solveFor: {
      F: {
        rearrangedFormula: 'F = (m × v²) / r',
        unit: 'N',
        calculate: ({ m, v, r }) => {
          if (r === 0) throw new Error('Radius cannot be zero.');
          const ans = (m * v * v) / r;
          const a_c = (v * v) / r;
          return {
            result: ans,
            substitution: `F = (${m} × ${v}²) / ${r}`,
            steps: [
              `Centripetal acceleration a_c = v²/r = (${v}²)/${r} = ${formatNum(a_c, 3)} m/s²`,
              `Force F = m × a_c = ${m} × ${formatNum(a_c, 3)} = ${formatNum(ans)} N`,
            ],
          };
        },
      },
      v: {
        rearrangedFormula: 'v = √(F × r / m)',
        unit: 'm/s',
        calculate: ({ F, r, m }) => {
          if (m === 0) throw new Error('Mass cannot be zero.');
          const ans = Math.sqrt((F * r) / m);
          return {
            result: ans,
            substitution: `v = √(${F} × ${r} / ${m})`,
            steps: [`Rearrange: v = √(Fr/m)`, `Compute: √(${F * r} / ${m}) = ${formatNum(ans, 3)} m/s`],
          };
        },
      },
    },
  },

  // 28. Simple Harmonic Motion: Simple Pendulum (T = 2pi * sqrt(l/g))
  {
    id: 'shm_pendulum',
    category: 'Waves & Sound',
    name: 'Simple Pendulum Period (T = 2π√(l/g))',
    baseFormula: 'T = 2π × √(l / g)',
    description: 'Period of oscillation of a simple pendulum.',
    variables: [
      { symbol: 'T', name: 'Period', unit: 's', defaultValue: 2.007 },
      { symbol: 'l', name: 'Length of Pendulum (l)', unit: 'm', defaultValue: 1.0 },
      { symbol: 'g', name: 'Gravity (g)', unit: 'm/s²', defaultValue: 9.8 },
    ],
    solveFor: {
      T: {
        rearrangedFormula: 'T = 2π × √(l / g)',
        unit: 's',
        calculate: ({ l, g }) => {
          if (g === 0) throw new Error('Gravity cannot be zero.');
          const ans = 2 * Math.PI * Math.sqrt(l / g);
          return {
            result: ans,
            substitution: `T = 2 × 3.14159 × √(${l} / ${g})`,
            steps: [
              `Formula: T = 2π√(l/g)`,
              `l / g = ${l} ÷ ${g} = ${formatNum(l / g, 5)}`,
              `√(l/g) = ${formatNum(Math.sqrt(l / g), 5)}`,
              `Multiply by 2π: 2 × π × ${formatNum(Math.sqrt(l / g), 5)} = ${formatNum(ans, 4)} s`,
            ],
          };
        },
      },
      l: {
        rearrangedFormula: 'l = g × (T / 2π)²',
        unit: 'm',
        calculate: ({ T, g }) => {
          const ans = g * Math.pow(T / (2 * Math.PI), 2);
          return {
            result: ans,
            substitution: `l = ${g} × (${T} / (2π))²`,
            steps: [
              `Rearrange: l = g · (T / 2π)²`,
              `T / 2π = ${T} / (2 × 3.1416) = ${formatNum(T / (2 * Math.PI), 5)}`,
              `Squared = ${formatNum(Math.pow(T / (2 * Math.PI), 2), 5)}`,
              `Multiply by g: ${g} × ${formatNum(Math.pow(T / (2 * Math.PI), 2), 5)} = ${formatNum(ans, 4)} m`,
            ],
          };
        },
      },
    },
  },

  // 29. Atomic & Nuclear Physics: E = mc^2 & Half-life
  {
    id: 'einstein_mass_energy',
    category: 'Atomic & Nuclear',
    name: 'Mass-Energy Equivalence (E = mc²)',
    baseFormula: 'E = m × c²',
    description: "Einstein's mass-energy equation where c = 3 × 10⁸ m/s.",
    variables: [
      { symbol: 'm', name: 'Mass Defect (m)', unit: 'kg', defaultValue: 0.001 },
      { symbol: 'c', name: 'Speed of Light (c)', unit: 'm/s', defaultValue: 300000000 },
    ],
    solveFor: {
      E: {
        rearrangedFormula: 'E = m × c²',
        unit: 'J',
        calculate: ({ m, c }) => {
          const ans = m * c * c;
          return {
            result: ans,
            substitution: `E = ${m} kg × (${c} m/s)²`,
            steps: [
              `Formula: E = mc²`,
              `c² = (${c})² = ${c * c} m²/s²`,
              `Compute: ${m} × ${c * c} = ${ans.toExponential(4)} J (${formatNum(ans)} J)`,
            ],
          };
        },
      },
    },
  },

  // 30. Hooke's Law
  {
    id: 'hookes_law',
    category: 'Mechanics',
    name: "Hooke's Law (Elastic Spring)",
    baseFormula: 'F = k * e',
    description: 'Relates restoring spring force to spring constant and extension/compression.',
    variables: [
      { symbol: 'F', name: 'Force', unit: 'N', defaultValue: 50 },
      { symbol: 'k', name: 'Spring Constant', unit: 'N/m', defaultValue: 250 },
      { symbol: 'e', name: 'Extension', unit: 'm', defaultValue: 0.2 },
    ],
    solveFor: {
      F: {
        rearrangedFormula: 'F = k * e',
        unit: 'N',
        calculate: ({ k, e }) => {
          const ans = k * e;
          return {
            result: ans,
            substitution: `F = ${k} * ${e}`,
            steps: [`Formula: F = k * e`, `Substitute: k = ${k} N/m, e = ${e} m`, `Calculate: ${k} * ${e} = ${formatNum(ans)} N`],
          };
        },
      },
      k: {
        rearrangedFormula: 'k = F / e',
        unit: 'N/m',
        calculate: ({ F, e }) => {
          if (e === 0) throw new Error('Extension cannot be zero.');
          const ans = F / e;
          return {
            result: ans,
            substitution: `k = ${F} / ${e}`,
            steps: [`Formula: k = F / e`, `Substitute: F = ${F} N, e = ${e} m`, `Calculate: ${F} ÷ ${e} = ${formatNum(ans)} N/m`],
          };
        },
      },
      e: {
        rearrangedFormula: 'e = F / k',
        unit: 'm',
        calculate: ({ F, k }) => {
          if (k === 0) throw new Error('Spring constant cannot be zero.');
          const ans = F / k;
          return {
            result: ans,
            substitution: `e = ${F} / ${k}`,
            steps: [`Formula: e = F / k`, `Substitute: F = ${F} N, k = ${k} N/m`, `Calculate: ${F} ÷ ${k} = ${formatNum(ans)} m`],
          };
        },
      },
    },
  },

  // 31. Elastic Strain Energy
  {
    id: 'strain_energy',
    category: 'Energy & Work',
    name: 'Elastic Strain Energy',
    baseFormula: 'E = 0.5 * k * e²',
    description: 'Calculates the work done in stretching or compressing a spring.',
    variables: [
      { symbol: 'E', name: 'Strain Energy', unit: 'J', defaultValue: 5 },
      { symbol: 'k', name: 'Spring Constant', unit: 'N/m', defaultValue: 250 },
      { symbol: 'e', name: 'Extension', unit: 'm', defaultValue: 0.2 },
    ],
    solveFor: {
      E: {
        rearrangedFormula: 'E = 0.5 * k * e²',
        unit: 'J',
        calculate: ({ k, e }) => {
          const ans = 0.5 * k * e * e;
          return {
            result: ans,
            substitution: `E = 0.5 * ${k} * (${e})²`,
            steps: [`Formula: E = 0.5 * k * e²`, `e² = ${e * e}`, `Compute: 0.5 * ${k} * ${e * e} = ${formatNum(ans)} J`],
          };
        },
      },
      k: {
        rearrangedFormula: 'k = 2E / e²',
        unit: 'N/m',
        calculate: ({ E, e }) => {
          if (e === 0) throw new Error('Extension cannot be zero.');
          const ans = (2 * E) / (e * e);
          return {
            result: ans,
            substitution: `k = (2 * ${E}) / (${e})²`,
            steps: [`Formula: k = 2E / e²`, `Denominator: ${e}² = ${e * e}`, `Compute: (2 * ${E}) ÷ ${e * e} = ${formatNum(ans)} N/m`],
          };
        },
      },
      e: {
        rearrangedFormula: 'e = sqrt(2E / k)',
        unit: 'm',
        calculate: ({ E, k }) => {
          if (k <= 0) throw new Error('Spring constant must be greater than zero.');
          const val = (2 * E) / k;
          if (val < 0) throw new Error('Cannot take square root of a negative value.');
          const ans = Math.sqrt(val);
          return {
            result: ans,
            substitution: `e = sqrt((2 * ${E}) / ${k})`,
            steps: [`Formula: e = √(2E / k)`, `Inside root: (2 * ${E}) / ${k} = ${val}`, `Compute square root: √(${val}) = ${formatNum(ans)} m`],
          };
        },
      },
    },
  },

  // 32. Charles's Law
  {
    id: 'charles_law',
    category: 'Thermal Physics',
    name: "Charles's Law (Constant Pressure)",
    baseFormula: 'V1 / T1 = V2 / T2',
    description: 'Volume of a gas is directly proportional to absolute temperature at constant pressure.',
    variables: [
      { symbol: 'V1', name: 'Initial Volume', unit: 'L', defaultValue: 2.5 },
      { symbol: 'T1', name: 'Initial Temp', unit: 'K', defaultValue: 300 },
      { symbol: 'V2', name: 'Final Volume', unit: 'L', defaultValue: 3.5 },
      { symbol: 'T2', name: 'Final Temp', unit: 'K', defaultValue: 420 },
    ],
    solveFor: {
      V2: {
        rearrangedFormula: 'V2 = (V1 * T2) / T1',
        unit: 'L',
        calculate: ({ V1, T1, T2 }) => {
          if (T1 === 0) throw new Error('Temperature cannot be absolute zero.');
          const ans = (V1 * T2) / T1;
          return {
            result: ans,
            substitution: `V2 = (${V1} * ${T2}) / ${T1}`,
            steps: [`Formula: V2 = (V1 * T2) / T1`, `Numerator: ${V1} * ${T2} = ${V1 * T2}`, `Compute: (${V1 * T2}) ÷ ${T1} = ${formatNum(ans)} L`],
          };
        },
      },
      T2: {
        rearrangedFormula: 'T2 = (V2 * T1) / V1',
        unit: 'K',
        calculate: ({ V1, T1, V2 }) => {
          if (V1 === 0) throw new Error('Volume cannot be zero.');
          const ans = (V2 * T1) / V1;
          return {
            result: ans,
            substitution: `T2 = (${V2} * ${T1}) / ${V1}`,
            steps: [`Formula: T2 = (V2 * T1) / V1`, `Numerator: ${V2} * ${T1} = ${V2 * T1}`, `Compute: (${V2 * T1}) ÷ ${V1} = ${formatNum(ans)} K`],
          };
        },
      },
      V1: {
        rearrangedFormula: 'V1 = (V2 * T1) / T2',
        unit: 'L',
        calculate: ({ V2, T1, T2 }) => {
          if (T2 === 0) throw new Error('Temperature cannot be zero.');
          const ans = (V2 * T1) / T2;
          return {
            result: ans,
            substitution: `V1 = (${V2} * ${T1}) / ${T2}`,
            steps: [`Formula: V1 = (V2 * T1) / T2`, `Compute: (${V2 * T1}) ÷ ${T2} = ${formatNum(ans)} L`],
          };
        },
      },
    },
  },

  // 33. Ideal Gas Law
  {
    id: 'ideal_gas_law',
    category: 'Thermal Physics',
    name: 'Ideal Gas Law (PV = nRT)',
    baseFormula: 'P * V = n * R * T',
    description: 'Equation of state of a hypothetical ideal gas (R = 8.314 J/(mol·K)).',
    variables: [
      { symbol: 'P', name: 'Pressure', unit: 'Pa', defaultValue: 101325 },
      { symbol: 'V', name: 'Volume', unit: 'm³', defaultValue: 0.024 },
      { symbol: 'n', name: 'Moles', unit: 'mol', defaultValue: 1 },
      { symbol: 'T', name: 'Temperature', unit: 'K', defaultValue: 298 },
    ],
    solveFor: {
      P: {
        rearrangedFormula: 'P = (n * R * T) / V',
        unit: 'Pa',
        calculate: ({ n, T, V }) => {
          const R = 8.314;
          if (V === 0) throw new Error('Volume cannot be zero.');
          const ans = (n * R * T) / V;
          return {
            result: ans,
            substitution: `P = (${n} * 8.314 * ${T}) / ${V}`,
            steps: [`R constant = 8.314 J/(mol·K)`, `Numerator: ${n} * 8.314 * ${T} = ${n * 8.314 * T}`, `Compute: (${n * 8.314 * T}) ÷ ${V} = ${formatNum(ans)} Pa`],
          };
        },
      },
      V: {
        rearrangedFormula: 'V = (n * R * T) / P',
        unit: 'm³',
        calculate: ({ n, T, P }) => {
          const R = 8.314;
          if (P === 0) throw new Error('Pressure cannot be zero.');
          const ans = (n * R * T) / P;
          return {
            result: ans,
            substitution: `V = (${n} * 8.314 * ${T}) / ${P}`,
            steps: [`Numerator: ${n} * 8.314 * ${T} = ${n * 8.314 * T}`, `Compute: (${n * 8.314 * T}) ÷ ${P} = ${formatNum(ans)} m³`],
          };
        },
      },
      T: {
        rearrangedFormula: 'T = (P * V) / (n * R)',
        unit: 'K',
        calculate: ({ P, V, n }) => {
          const R = 8.314;
          if (n === 0) throw new Error('Number of moles cannot be zero.');
          const ans = (P * V) / (n * R);
          return {
            result: ans,
            substitution: `T = (${P} * ${V}) / (${n} * 8.314)`,
            steps: [`Numerator: ${P} * ${V} = ${P * V}`, `Denominator: ${n} * 8.314 = ${n * 8.314}`, `Compute: ${P * V} ÷ ${n * 8.314} = ${formatNum(ans)} K`],
          };
        },
      },
    },
  },

  // 34. Newton's Universal Gravitation
  {
    id: 'universal_gravitation',
    category: 'Mechanics',
    name: "Universal Gravitation (Newton)",
    baseFormula: 'F = G * (m1 * m2) / r²',
    description: 'Gravitational attraction between two masses (G = 6.674e-11 N·m²/kg²).',
    variables: [
      { symbol: 'm1', name: 'Mass 1', unit: 'kg', defaultValue: 5.972e24 },
      { symbol: 'm2', name: 'Mass 2', unit: 'kg', defaultValue: 70 },
      { symbol: 'r', name: 'Distance', unit: 'm', defaultValue: 6.371e6 },
    ],
    solveFor: {
      F: {
        rearrangedFormula: 'F = G * (m1 * m2) / r²',
        unit: 'N',
        calculate: ({ m1, m2, r }) => {
          const G = 6.6743e-11;
          if (r === 0) throw new Error('Distance cannot be zero.');
          const ans = (G * m1 * m2) / (r * r);
          return {
            result: ans,
            substitution: `F = (6.674e-11 * ${m1} * ${m2}) / (${r})²`,
            steps: [`G constant = 6.6743 × 10⁻¹¹ N·m²/kg²`, `Numerator: ${G * m1 * m2}`, `Denominator r² = ${r * r}`, `Compute: ${ans.toExponential(4)} N (${formatNum(ans)} N)`],
          };
        },
      },
    },
  },

  // 35. Coulomb's Law
  {
    id: 'coulombs_law',
    category: 'Electricity & Magnetism',
    name: "Coulomb's Law of Electrostatics",
    baseFormula: 'F = k * (q1 * q2) / r²',
    description: 'Electrostatic force between two charges (k = 8.988e9 N·m²/C²).',
    variables: [
      { symbol: 'q1', name: 'Charge 1', unit: 'C', defaultValue: 1e-6 },
      { symbol: 'q2', name: 'Charge 2', unit: 'C', defaultValue: 2e-6 },
      { symbol: 'r', name: 'Separation', unit: 'm', defaultValue: 0.05 },
    ],
    solveFor: {
      F: {
        rearrangedFormula: 'F = k * (q1 * q2) / r²',
        unit: 'N',
        calculate: ({ q1, q2, r }) => {
          const k = 8.98755e9;
          if (r === 0) throw new Error('Separation cannot be zero.');
          const ans = (k * Math.abs(q1 * q2)) / (r * r);
          return {
            result: ans,
            substitution: `F = (8.988e9 * ${q1} * ${q2}) / (${r})²`,
            steps: [`Coulomb constant k = 8.988 × 10⁹ N·m²/C²`, `Numerator: ${k * Math.abs(q1 * q2)}`, `Denominator: ${r * r}`, `Compute: ${formatNum(ans)} N`],
          };
        },
      },
    },
  },

  // 36. Transformer Ratio
  {
    id: 'transformer_ratio',
    category: 'Electricity & Magnetism',
    name: 'Transformer Voltage and Turns Ratio',
    baseFormula: 'Vp / Vs = Np / Ns',
    description: 'Calculates primary and secondary voltages and turn counts in an ideal transformer.',
    variables: [
      { symbol: 'Vp', name: 'Primary Voltage', unit: 'V', defaultValue: 240 },
      { symbol: 'Vs', name: 'Secondary Voltage', unit: 'V', defaultValue: 12 },
      { symbol: 'Np', name: 'Primary Turns', unit: 'turns', defaultValue: 1000 },
      { symbol: 'Ns', name: 'Secondary Turns', unit: 'turns', defaultValue: 50 },
    ],
    solveFor: {
      Vs: {
        rearrangedFormula: 'Vs = (Vp * Ns) / Np',
        unit: 'V',
        calculate: ({ Vp, Ns, Np }) => {
          if (Np === 0) throw new Error('Primary turns cannot be zero.');
          const ans = (Vp * Ns) / Np;
          return {
            result: ans,
            substitution: `Vs = (${Vp} * ${Ns}) / ${Np}`,
            steps: [`Formula: Vs = (Vp * Ns) / Np`, `Numerator: ${Vp} * ${Ns} = ${Vp * Ns}`, `Compute: (${Vp * Ns}) ÷ ${Np} = ${formatNum(ans)} V`],
          };
        },
      },
      Vp: {
        rearrangedFormula: 'Vp = (Vs * Np) / Ns',
        unit: 'V',
        calculate: ({ Vs, Np, Ns }) => {
          if (Ns === 0) throw new Error('Secondary turns cannot be zero.');
          const ans = (Vs * Np) / Ns;
          return {
            result: ans,
            substitution: `Vp = (${Vs} * ${Np}) / ${Ns}`,
            steps: [`Formula: Vp = (Vs * Np) / Ns`, `Compute: (${Vs} * ${Np}) ÷ ${Ns} = ${formatNum(ans)} V`],
          };
        },
      },
      Ns: {
        rearrangedFormula: 'Ns = (Np * Vs) / Vp',
        unit: 'turns',
        calculate: ({ Np, Vs, Vp }) => {
          if (Vp === 0) throw new Error('Primary voltage cannot be zero.');
          const ans = (Np * Vs) / Vp;
          return {
            result: ans,
            substitution: `Ns = (${Np} * ${Vs}) / ${Vp}`,
            steps: [`Formula: Ns = (Np * Vs) / Vp`, `Compute: (${Np} * ${Vs}) ÷ ${Vp} = ${formatNum(ans)} turns`],
          };
        },
      },
    },
  },

  // 37. Photoelectric Effect
  {
    id: 'photoelectric_effect',
    category: 'Modern & Advanced',
    name: "Einstein's Photoelectric Effect",
    baseFormula: 'Ek = h * f - W0',
    description: 'Kinetic energy of emitted photoelectrons from frequency and work function (h = 6.626e-34 J·s).',
    variables: [
      { symbol: 'f', name: 'Photon Frequency', unit: 'Hz', defaultValue: 8e14 },
      { symbol: 'W0', name: 'Work Function', unit: 'J', defaultValue: 3.2e-19 },
    ],
    solveFor: {
      Ek: {
        rearrangedFormula: 'Ek = h * f - W0',
        unit: 'J',
        calculate: ({ f, W0 }) => {
          const h = 6.62607e-34;
          const energyPhoton = h * f;
          const ans = energyPhoton - W0;
          return {
            result: ans,
            substitution: `Ek = (6.626e-34 * ${f}) - ${W0}`,
            steps: [
              `Photon energy E = h * f = 6.626e-34 * ${f} = ${energyPhoton.toExponential(4)} J`,
              `Subtract work function W0 = ${W0} J`,
              `Maximum Kinetic Energy = ${ans.toExponential(4)} J (${(ans / 1.602e-19).toFixed(3)} eV)`,
            ],
          };
        },
      },
    },
  },

  // 38. Radioactive Decay Half-Life
  {
    id: 'radioactive_decay',
    category: 'Atomic & Nuclear',
    name: 'Radioactivity & Half-Life Decay',
    baseFormula: 'N = N0 * (1/2)^(t / T_half)',
    description: 'Calculates the remaining quantity of radioactive material after elapsed time t.',
    variables: [
      { symbol: 'N0', name: 'Initial Quantity', unit: 'g', defaultValue: 100 },
      { symbol: 't', name: 'Elapsed Time', unit: 'years', defaultValue: 15 },
      { symbol: 'T_half', name: 'Half-Life', unit: 'years', defaultValue: 5 },
    ],
    solveFor: {
      N: {
        rearrangedFormula: 'N = N0 * 0.5^(t / T_half)',
        unit: 'g',
        calculate: ({ N0, t, T_half }) => {
          if (T_half === 0) throw new Error('Half-life cannot be zero.');
          const halfLifeCount = t / T_half;
          const ans = N0 * Math.pow(0.5, halfLifeCount);
          return {
            result: ans,
            substitution: `N = ${N0} * (0.5)^(${t} / ${T_half})`,
            steps: [
              `Number of half-lives elapsed = ${t} ÷ ${T_half} = ${halfLifeCount}`,
              `Decay factor = (0.5)^${halfLifeCount} = ${Math.pow(0.5, halfLifeCount).toFixed(6)}`,
              `Remaining quantity N = ${N0} × ${Math.pow(0.5, halfLifeCount).toFixed(6)} = ${formatNum(ans)} g`,
            ],
          };
        },
      },
    },
  },

  // 39. Electric Field Strength
  {
    id: 'electric_field_strength',
    category: 'Electricity & Magnetism',
    name: 'Electric Field Strength (Uniform)',
    baseFormula: 'E = V / d',
    description: 'Electric field intensity between parallel plates separated by distance d with potential V.',
    variables: [
      { symbol: 'V', name: 'Potential Diff', unit: 'V', defaultValue: 500 },
      { symbol: 'd', name: 'Separation Distance', unit: 'm', defaultValue: 0.02 },
    ],
    solveFor: {
      E: {
        rearrangedFormula: 'E = V / d',
        unit: 'V/m',
        calculate: ({ V, d }) => {
          if (d === 0) throw new Error('Distance cannot be zero.');
          const ans = V / d;
          return {
            result: ans,
            substitution: `E = ${V} / ${d}`,
            steps: [`Formula: E = V / d`, `Substitute: V = ${V} V, d = ${d} m`, `Compute: ${V} ÷ ${d} = ${formatNum(ans)} V/m (or N/C)`],
          };
        },
      },
    },
  },

  // 40. Magnetic Force on Moving Charge
  {
    id: 'lorentz_magnetic_force',
    category: 'Electricity & Magnetism',
    name: 'Magnetic Force on Charge (F = qvB)',
    baseFormula: 'F = q * v * B',
    description: 'Perpendicular Lorentz force on a charge moving through a magnetic field B.',
    variables: [
      { symbol: 'q', name: 'Charge', unit: 'C', defaultValue: 1.6e-19 },
      { symbol: 'v', name: 'Velocity', unit: 'm/s', defaultValue: 2e6 },
      { symbol: 'B', name: 'Magnetic Field', unit: 'T', defaultValue: 0.5 },
    ],
    solveFor: {
      F: {
        rearrangedFormula: 'F = q * v * B',
        unit: 'N',
        calculate: ({ q, v, B }) => {
          const ans = q * v * B;
          return {
            result: ans,
            substitution: `F = ${q} * ${v} * ${B}`,
            steps: [`Formula: F = q * v * B`, `Compute: ${q} * ${v} * ${B} = ${ans.toExponential(4)} N`],
          };
        },
      },
    },
  },

  // 41. De Broglie Wavelength
  {
    id: 'de_broglie_wavelength',
    category: 'Atomic & Nuclear',
    name: 'De Broglie Matter Wavelength',
    baseFormula: 'λ = h / (m * v)',
    description: 'Wave-particle duality wavelength associated with a moving mass m at velocity v.',
    variables: [
      { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: 9.109e-31 },
      { symbol: 'v', name: 'Velocity', unit: 'm/s', defaultValue: 1e6 },
    ],
    solveFor: {
      lambda: {
        rearrangedFormula: 'λ = h / (m * v)',
        unit: 'm',
        calculate: ({ m, v }) => {
          const h = 6.62607e-34;
          const p = m * v;
          if (p === 0) throw new Error('Momentum cannot be zero.');
          const ans = h / p;
          return {
            result: ans,
            substitution: `λ = 6.626e-34 / (${m} * ${v})`,
            steps: [
              `Momentum p = m * v = ${p.toExponential(4)} kg·m/s`,
              `Compute λ = h / p = 6.626e-34 ÷ ${p.toExponential(4)} = ${ans.toExponential(4)} m (${(ans * 1e9).toFixed(4)} nm)`,
            ],
          };
        },
      },
    },
  },

  // 42. Escape Velocity
  {
    id: 'escape_velocity',
    category: 'Mechanics',
    name: 'Escape Velocity from Planet',
    baseFormula: 'v_e = sqrt(2 * G * M / R)',
    description: 'Minimum speed needed for an object to escape the gravitational field of a primary mass M.',
    variables: [
      { symbol: 'M', name: 'Planet Mass', unit: 'kg', defaultValue: 5.972e24 },
      { symbol: 'R', name: 'Planet Radius', unit: 'm', defaultValue: 6.371e6 },
    ],
    solveFor: {
      ve: {
        rearrangedFormula: 'v_e = sqrt(2 * G * M / R)',
        unit: 'm/s',
        calculate: ({ M, R }) => {
          const G = 6.6743e-11;
          if (R === 0) throw new Error('Radius cannot be zero.');
          const ans = Math.sqrt((2 * G * M) / R);
          return {
            result: ans,
            substitution: `v_e = sqrt((2 * 6.674e-11 * ${M}) / ${R})`,
            steps: [
              `G = 6.6743 × 10⁻¹¹ N·m²/kg²`,
              `Inside root: (2 * G * M) / R = ${(2 * G * M) / R}`,
              `Escape Velocity = √(${(2 * G * M) / R}) = ${formatNum(ans)} m/s (${(ans / 1000).toFixed(2)} km/s)`,
            ],
          };
        },
      },
    },
  },

  // 43. Thermal Conduction
  {
    id: 'thermal_conduction',
    category: 'Thermal Physics',
    name: 'Thermal Conduction Rate',
    baseFormula: 'Q/t = (k * A * ΔT) / d',
    description: 'Rate of heat transfer through a material of thermal conductivity k, area A, and thickness d.',
    variables: [
      { symbol: 'k', name: 'Conductivity', unit: 'W/(m·K)', defaultValue: 0.8 },
      { symbol: 'A', name: 'Surface Area', unit: 'm²', defaultValue: 15 },
      { symbol: 'deltaT', name: 'Temp Difference', unit: 'K', defaultValue: 20 },
      { symbol: 'd', name: 'Thickness', unit: 'm', defaultValue: 0.15 },
    ],
    solveFor: {
      H: {
        rearrangedFormula: 'H = (k * A * ΔT) / d',
        unit: 'W',
        calculate: ({ k, A, deltaT, d }) => {
          if (d === 0) throw new Error('Thickness cannot be zero.');
          const ans = (k * A * deltaT) / d;
          return {
            result: ans,
            substitution: `H = (${k} * ${A} * ${deltaT}) / ${d}`,
            steps: [`Numerator: ${k} * ${A} * ${deltaT} = ${k * A * deltaT}`, `Compute: (${k * A * deltaT}) ÷ ${d} = ${formatNum(ans)} Watts`],
          };
        },
      },
    },
  },

  // 44. LC Circuit Resonance
  {
    id: 'lc_resonance',
    category: 'Electricity & Magnetism',
    name: 'Resonant Frequency of LC Circuit',
    baseFormula: 'f = 1 / (2 * π * sqrt(L * C))',
    description: 'Natural resonant oscillation frequency of an ideal inductor-capacitor tank circuit.',
    variables: [
      { symbol: 'L', name: 'Inductance', unit: 'H', defaultValue: 10e-3 },
      { symbol: 'C', name: 'Capacitance', unit: 'F', defaultValue: 100e-9 },
    ],
    solveFor: {
      f: {
        rearrangedFormula: 'f = 1 / (2 * π * sqrt(L * C))',
        unit: 'Hz',
        calculate: ({ L, C }) => {
          if (L <= 0 || C <= 0) throw new Error('L and C must be greater than zero.');
          const ans = 1 / (2 * Math.PI * Math.sqrt(L * C));
          return {
            result: ans,
            substitution: `f = 1 / (2 * π * sqrt(${L} * ${C}))`,
            steps: [
              `L * C product = ${L * C}`,
              `Square root √(LC) = ${Math.sqrt(L * C).toExponential(4)}`,
              `Denominator 2π√(LC) = ${(2 * Math.PI * Math.sqrt(L * C)).toExponential(4)}`,
              `Resonant Frequency = ${formatNum(ans)} Hz (${(ans / 1000).toFixed(2)} kHz)`,
            ],
          };
        },
      },
    },
  },
];

/**
 * Execute a physics formula solver
 */
export function solvePhysicsFormula(
  formulaId: string,
  targetVar: string,
  inputValues: Record<string, number>
): StepSolution {
  const formulaDef = PHYSICS_FORMULAS.find((f) => f.id === formulaId);
  if (!formulaDef) {
    throw new Error(`Formula with ID "${formulaId}" not found.`);
  }

  const solver = formulaDef.solveFor[targetVar];
  if (!solver) {
    throw new Error(`Target variable "${targetVar}" cannot be solved in ${formulaDef.name}.`);
  }

  // Validate missing inputs
  const requiredVars = formulaDef.variables.filter((v) => v.symbol !== targetVar);
  for (const v of requiredVars) {
    if (inputValues[v.symbol] === undefined || isNaN(inputValues[v.symbol])) {
      throw new Error(`Missing value for "${v.name}" (${v.symbol}). Please enter a valid number.`);
    }
  }

  const calculation = solver.calculate(inputValues);

  return {
    title: formulaDef.name,
    category: 'Physics',
    subCategory: formulaDef.category,
    problemStatement: `Solve for ${targetVar.toUpperCase()} in "${formulaDef.name}"`,
    formula: formulaDef.baseFormula,
    rearrangedFormula: solver.rearrangedFormula,
    substitution: calculation.substitution,
    steps: calculation.steps,
    finalAnswer: `${formatNum(calculation.result, 4)}`,
    unit: solver.unit,
  };
}
