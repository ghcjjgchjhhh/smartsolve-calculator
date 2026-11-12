import { AiGraphData, StepSolution } from '../types';

/**
 * Accurately detects the physical entity from problem text (e.g. Plane, Stone, Car, Ball, Rocket, Train)
 */
export function detectSimulationObjectLabel(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes('plane') ||
    lower.includes('airplane') ||
    lower.includes('aeroplane') ||
    lower.includes('jet') ||
    lower.includes('aircraft') ||
    lower.includes('airliner') ||
    lower.includes('flight') ||
    lower.includes('runway') ||
    lower.includes('take off') ||
    lower.includes('takeoff') ||
    lower.includes('aviation') ||
    lower.includes('flying') ||
    lower.includes('pilot')
  ) {
    return 'Plane';
  }
  if (
    lower.includes('stone') ||
    lower.includes('rock') ||
    lower.includes('pebble') ||
    lower.includes('cliff') ||
    lower.includes('boulder') ||
    lower.includes('dropped') ||
    lower.includes('height of') ||
    lower.includes('falls from') ||
    lower.includes('free fall') ||
    lower.includes('freefall') ||
    lower.includes('thrown vertically') ||
    lower.includes('tower') ||
    lower.includes('plummet')
  ) {
    return 'Stone';
  }
  if (
    lower.includes('rocket') ||
    lower.includes('missile') ||
    lower.includes('spacecraft') ||
    lower.includes('shuttle') ||
    lower.includes('launch') ||
    lower.includes('thrust') ||
    lower.includes('booster') ||
    lower.includes('propulsion')
  ) {
    return 'Rocket';
  }
  if (
    lower.includes('train') ||
    lower.includes('locomotive') ||
    lower.includes('rail') ||
    lower.includes('railway') ||
    lower.includes('railroad') ||
    lower.includes('station') ||
    lower.includes('carriage') ||
    lower.includes('subway') ||
    lower.includes('metro')
  ) {
    return 'Train';
  }
  if (
    lower.includes('bicycle') ||
    lower.includes('bike') ||
    lower.includes('cyclist') ||
    lower.includes('cycling') ||
    lower.includes('cycle') ||
    lower.includes('pedal')
  ) {
    return 'Bicycle';
  }
  if (
    lower.includes('runner') ||
    lower.includes('sprinter') ||
    lower.includes('athlete') ||
    lower.includes('running') ||
    lower.includes('man running') ||
    lower.includes('person running') ||
    lower.includes('sprint') ||
    lower.includes('jogger') ||
    lower.includes('jogging') ||
    lower.includes('marathon')
  ) {
    return 'Runner';
  }
  if (
    lower.includes('boat') ||
    lower.includes('ship') ||
    lower.includes('canoe') ||
    lower.includes('ferry') ||
    lower.includes('vessel') ||
    lower.includes('submarine') ||
    lower.includes('sailing') ||
    lower.includes('sail') ||
    lower.includes('kayak')
  ) {
    return 'Boat';
  }
  if (
    lower.includes('ball') ||
    lower.includes('football') ||
    lower.includes('basketball') ||
    lower.includes('tennis') ||
    lower.includes('cricket') ||
    lower.includes('sphere') ||
    lower.includes('cannonball') ||
    lower.includes('bullet') ||
    lower.includes('projectile') ||
    lower.includes('kicked')
  ) {
    return 'Ball';
  }
  if (
    lower.includes('car') ||
    lower.includes('truck') ||
    lower.includes('bus') ||
    lower.includes('automobile') ||
    lower.includes('lorry') ||
    lower.includes('van') ||
    lower.includes('driver') ||
    lower.includes('vehicle') ||
    lower.includes('motorist') ||
    lower.includes('sedan')
  ) {
    return 'Car';
  }
  return 'Car';
}

/**
 * Intelligent Graph Detector & Synthesizer
 * Ensures every problem involving kinematics, functions, trajectories, calculus,
 * or curves receives a rich, interactive, animated simulation graph.
 */
export function detectAndEnhanceGraphs(
  solution: StepSolution,
  prompt?: string
): AiGraphData[] {
  const combinedText = `
    ${solution.title || ''} 
    ${solution.subCategory || ''} 
    ${solution.category || ''} 
    ${solution.problemStatement || ''} 
    ${solution.formula || ''} 
    ${solution.finalAnswer || ''} 
    ${prompt || ''} 
    ${(solution.steps || []).join(' ')}
    ${(solution.givenValues || []).map((g) => `${g.name} ${g.symbol}`).join(' ')}
  `.toLowerCase();

  const detectedObjectLabel = detectSimulationObjectLabel(combinedText);

  // CRITICAL SANITY CHECK:
  // If the problem is genuinely a pure geometry question (circle, chord, radius, tangent to circle, triangle, incline, optics, circuit, etc.)
  // and does NOT explicitly ask for a Cartesian/kinematics graph:
  // DO NOT generate or retain any hallucinated graphs!
  const isPureGeometry =
    /\b(circle|chord|radius|diameter|tangent\s+to\s+(?:the|a)\s+circle|secant|cyclic|perpendicular\s+distance|centre\s+o|center\s+o|inscribed|subtended|semicircle|triangle|incline|optics|lens|mirror|fulcrum|lever|circuit)\b/i.test(
      combinedText
    );
  const isExplicitGraph =
    /\b(velocity-time|displacement-time|acceleration-time|v-t\s+graph|s-t\s+graph|a-t\s+graph|plot\s+the\s+graph|draw\s+the\s+graph|sketch\s+the\s+graph|cartesian|x-axis|y-axis|axes|coordinate\s+plane|grid|linear\s+graph|straight\s+line\s+graph)\b/i.test(
      combinedText
    );

  if (isPureGeometry && !isExplicitGraph) {
    solution.graphs = [];
    return [];
  }

  // If the solution already has valid graphs generated by Gemini AI, ensure every graph's simulation.objectLabel is updated with the accurately detected physical entity!
  if (solution.graphs && solution.graphs.length > 0) {
    solution.graphs.forEach((g) => {
      if (g.simulation) {
        g.simulation.objectLabel = detectedObjectLabel;
      } else {
        g.simulation = {
          hasSimulation: true,
          type: g.graphType === 'projectile_motion' ? 'projectile_2d' : 'motion_1d',
          duration: g.xAxis.max || 10,
          objectLabel: detectedObjectLabel,
        };
      }
    });
    return solution.graphs;
  }

  const graphs: AiGraphData[] = [];

  // Helper: extract numeric value of a given quantity or fallback
  const getGiven = (symbol: string, fallback: number): number => {
    const found = solution.givenValues?.find(
      (g) => g.symbol.toLowerCase() === symbol.toLowerCase() || g.name.toLowerCase().includes(symbol.toLowerCase())
    );
    if (found) {
      const parsed = parseFloat(found.value.replace(/[^0-9.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
    // Also try regex in text
    const re = new RegExp(`${symbol}\\s*=\\s*([0-9.]+)`, 'i');
    const match = combinedText.match(re);
    if (match) {
      const val = parseFloat(match[1]);
      if (Number.isFinite(val)) return val;
    }
    return fallback;
  };

  // 1. VELOCITY-TIME GRAPH ($v-t$)
  if (
    combinedText.includes('velocity-time') ||
    combinedText.includes('velocity time') ||
    combinedText.includes('v-t graph') ||
    combinedText.includes('accelerat') && combinedText.includes('velocity') && (combinedText.includes('graph') || combinedText.includes('motion') || combinedText.includes('car') || combinedText.includes('train'))
  ) {
    // A. Multi-stage journey (e.g. Accelerates to 30 m/s in 10s, constant for 20s, decelerates to rest in 10s)
    const isMultiStage =
      (combinedText.includes('constant') || combinedText.includes('cruis') || combinedText.includes('uniform velocity') || combinedText.includes('slowing down') || combinedText.includes('deceler')) &&
      (combinedText.includes('rest') || combinedText.includes('stop') || combinedText.includes('deceler') || combinedText.includes('retard') || combinedText.includes('trapez'));

    if (isMultiStage) {
      // Extract vMax (e.g. 30 m/s)
      const vMatch =
        combinedText.match(/(?:velocity of|speed of|velocity to|speed to|to a velocity of|to a speed of|to)\s*(\d+(?:\.\d+)?)\s*(?:m\/s|ms-1|km\/h)/i) ||
        combinedText.match(/(\d+(?:\.\d+)?)\s*(?:m\/s|ms-1)/i);
      const vMax = vMatch ? parseFloat(vMatch[1]) : getGiven('v', 30);

      // Extract time intervals:
      const timeMatches = [...combinedText.matchAll(/(\d+(?:\.\d+)?)\s*(?:seconds|second|sec|s\b)/gi)].map((m) =>
        parseFloat(m[1])
      );
      let t1 = 10;
      let t2 = 20;
      let t3 = 10;
      if (timeMatches.length >= 3) {
        t1 = timeMatches[0];
        t2 = timeMatches[1];
        t3 = timeMatches[2];
      } else if (timeMatches.length === 2) {
        t1 = timeMatches[0];
        t2 = timeMatches[1];
        t3 = 10;
      }

      const totalTime = t1 + t2 + t3;
      const accel = vMax / (t1 || 1);
      const decel = vMax / (t3 || 1);
      const s1 = 0.5 * t1 * vMax;
      const s2 = t2 * vMax;
      const s3 = 0.5 * t3 * vMax;
      const totalDistance = s1 + s2 + s3;
      const vAvg = totalDistance / (totalTime || 1);

      graphs.push({
        id: 'graph_vt_trapezoid',
        title: 'Trapezoidal Velocity-Time Graph (v-t)',
        category: 'physics',
        graphType: 'velocity_time',
        xAxis: {
          label: 'Time',
          unit: 's',
          min: 0,
          max: Math.ceil(totalTime * 1.15),
          step: Math.max(Math.floor(totalTime / 8), 5),
        },
        yAxis: {
          label: 'Velocity',
          unit: 'm/s',
          min: 0,
          max: Math.ceil(vMax * 1.25),
          step: Math.max(Math.floor(vMax / 5), 5),
        },
        curves: [
          {
            id: 'v_trapezoid',
            label: 'Velocity v(t)',
            color: '#22C55E',
            equationText: `a=${accel.toFixed(1)}m/s², v=${vMax}m/s, decel=${decel.toFixed(1)}m/s²`,
            type: 'piecewise',
            segments: [
              {
                t0: 0,
                t1: t1,
                fn: `${accel} * t`,
                label: `Acceleration: a = ${accel.toFixed(1)} m/s²`,
              },
              {
                t0: t1,
                t1: t1 + t2,
                fn: `${vMax}`,
                label: `Constant Speed: v = ${vMax} m/s`,
              },
              {
                t0: t1 + t2,
                t1: totalTime,
                fn: `${vMax} - ${decel} * (t - ${t1 + t2})`,
                label: `Deceleration: d = ${decel.toFixed(1)} m/s²`,
              },
            ],
            shadedArea: {
              fromX: 0,
              toX: totalTime,
              label: `Area = Total Distance s = ${totalDistance.toFixed(0)} m`,
              color: '#22C55E',
            },
          },
        ],
        keyPoints: [
          { x: 0, y: 0, label: 'Start from Rest (0s, 0m/s)', type: 'intercept' },
          { x: t1, y: vMax, label: `Top of Acceleration (${t1}s, ${vMax}m/s) [a = ${accel}m/s²]`, type: 'critical' },
          { x: t1 + t2, y: vMax, label: `Start Deceleration (${t1 + t2}s, ${vMax}m/s)`, type: 'critical' },
          { x: totalTime, y: 0, label: `Brought to Rest (${totalTime}s, 0m/s) [Decel = ${decel}m/s²]`, type: 'root' },
        ],
        featuresExplanation: {
          gradientMeaning: `Stage 1 slope = Acceleration a = ${accel.toFixed(2)} m/s². Stage 3 slope = Deceleration = ${decel.toFixed(2)} m/s² (slope = -${decel.toFixed(2)} m/s²).`,
          areaMeaning: `Area of Trapezium = 1/2 * (parallel sides) * height = 1/2 * (${t2} + ${totalTime}) * ${vMax} = ${totalDistance.toFixed(1)} m (Total Distance).`,
          interceptsMeaning: `Starts from rest at origin (0, 0), returns to zero velocity at t = ${totalTime} s.`,
          physicalInterpretation: `Average velocity = Total Distance / Total Time = ${totalDistance.toFixed(1)} m / ${totalTime} s = ${vAvg.toFixed(2)} m/s.`,
        },
        simulation: {
          hasSimulation: true,
          type: 'motion_1d',
          duration: totalTime,
          objectLabel: detectedObjectLabel,
          parameters: { vMax, t1, t2, t3, totalTime, totalDistance, accel, decel, vAvg },
        },
      });

      // Companion Displacement-Time Graph (s-t)
      graphs.push({
        id: 'graph_st_trapezoid',
        title: 'Displacement-Time Graph (s-t)',
        category: 'physics',
        graphType: 'displacement_time',
        xAxis: {
          label: 'Time',
          unit: 's',
          min: 0,
          max: Math.ceil(totalTime * 1.15),
          step: Math.max(Math.floor(totalTime / 8), 5),
        },
        yAxis: {
          label: 'Displacement',
          unit: 'm',
          min: 0,
          max: Math.ceil(totalDistance * 1.2),
          step: Math.max(Math.floor(totalDistance / 6), 50),
        },
        curves: [
          {
            id: 's_trapezoid',
            label: 'Displacement s(t)',
            color: '#38BDF8',
            type: 'piecewise',
            segments: [
              {
                t0: 0,
                t1: t1,
                fn: `0.5 * ${accel} * t * t`,
                label: `Parabolic acceleration: 0 to ${s1} m`,
              },
              {
                t0: t1,
                t1: t1 + t2,
                fn: `${s1} + ${vMax} * (t - ${t1})`,
                label: `Linear cruise: ${s1} to ${s1 + s2} m`,
              },
              {
                t0: t1 + t2,
                t1: totalTime,
                fn: `${s1 + s2} + ${vMax} * (t - ${t1 + t2}) - 0.5 * ${decel} * (t - ${t1 + t2}) * (t - ${t1 + t2})`,
                label: `Deceleration curve: ${s1 + s2} to ${totalDistance} m`,
              },
            ],
          },
        ],
        keyPoints: [
          { x: 0, y: 0, label: 'Origin (0m)', type: 'intercept' },
          { x: t1, y: s1, label: `Stage 1 End (${s1}m)`, type: 'critical' },
          { x: t1 + t2, y: s1 + s2, label: `Stage 2 End (${s1 + s2}m)`, type: 'critical' },
          { x: totalTime, y: totalDistance, label: `Total Distance (${totalDistance}m)`, type: 'max' },
        ],
        featuresExplanation: {
          gradientMeaning: 'Instantaneous slope ds/dt represents velocity at that exact second.',
          physicalInterpretation: `Reaches total displacement of ${totalDistance} m after ${totalTime} seconds.`,
        },
        simulation: {
          hasSimulation: true,
          type: 'motion_1d',
          duration: totalTime,
          objectLabel: detectedObjectLabel,
        },
      });

      return graphs;
    }

    // B. Standard single-stage linear acceleration
    const u = getGiven('u', getGiven('v0', 0));
    const a = getGiven('a', 2.5);
    const tMax = getGiven('t', 10);
    const vMax = u + a * tMax;

    graphs.push({
      id: 'graph_vt',
      title: 'Velocity-Time Graph (v-t)',
      category: 'physics',
      graphType: 'velocity_time',
      xAxis: { label: 'Time', unit: 's', min: 0, max: Math.max(tMax * 1.2, 10), step: 2 },
      yAxis: { label: 'Velocity', unit: 'm/s', min: Math.min(u, 0), max: Math.max(vMax * 1.2, 20), step: 5 },
      curves: [
        {
          id: 'v_curve',
          label: 'Velocity v(t)',
          color: '#22C55E',
          equationText: `v(t) = ${u} + ${a}t`,
          fnExpression: `${u} + ${a} * t`,
          shadedArea: {
            fromX: 0,
            toX: tMax,
            label: `Displacement s = ${(u * tMax + 0.5 * a * tMax * tMax).toFixed(1)} m`,
            color: '#22C55E',
          },
        },
      ],
      keyPoints: [
        { x: 0, y: u, label: 'Initial Velocity u', type: 'intercept' },
        { x: tMax, y: vMax, label: 'Final Velocity v', type: 'critical' },
      ],
      featuresExplanation: {
        gradientMeaning: `The slope (gradient) represents constant acceleration: a = dv/dt = ${a} m/s².`,
        areaMeaning: `The shaded area under the line represents the total displacement: s = ∫ v dt = ${(u * tMax + 0.5 * a * tMax * tMax).toFixed(1)} m.`,
        interceptsMeaning: `Y-intercept at t=0 represents initial velocity u = ${u} m/s.`,
        physicalInterpretation: 'Linear upward slope indicates uniform positive acceleration. Area beneath represents net distance travelled.',
      },
      simulation: {
        hasSimulation: true,
        type: 'motion_1d',
        duration: tMax,
        objectLabel: detectedObjectLabel,
        parameters: { u, a, tMax },
      },
    });

    // Also include companion Displacement-Time graph
    graphs.push({
      id: 'graph_st',
      title: 'Displacement-Time Graph (s-t)',
      category: 'physics',
      graphType: 'displacement_time',
      xAxis: { label: 'Time', unit: 's', min: 0, max: Math.max(tMax * 1.2, 10), step: 2 },
      yAxis: { label: 'Displacement', unit: 'm', min: 0, max: Math.max((u * tMax + 0.5 * a * tMax * tMax) * 1.2, 50), step: 20 },
      curves: [
        {
          id: 's_curve',
          label: 'Displacement s(t)',
          color: '#38BDF8',
          equationText: `s(t) = ${u}t + 0.5(${a})t²`,
          fnExpression: `${u} * t + 0.5 * ${a} * t * t`,
        },
      ],
      featuresExplanation: {
        gradientMeaning: 'The instantaneous slope of this s-t curve equals the velocity: v = ds/dt.',
        areaMeaning: 'Area under s-t has no primary standard physical quantity.',
        physicalInterpretation: 'Parabolic upward curve demonstrates increasing velocity over time.',
      },
      simulation: {
        hasSimulation: true,
        type: 'motion_1d',
        duration: tMax,
        objectLabel: detectedObjectLabel,
      },
    });

    return graphs;
  }

  // 2. PROJECTILE MOTION GRAPH
  if (
    combinedText.includes('projectile') ||
    combinedText.includes('trajectory') ||
    combinedText.includes('launch angle') ||
    (combinedText.includes('angle') && combinedText.includes('cliff') && combinedText.includes('range')) ||
    (combinedText.includes('stone') && combinedText.includes('thrown') && combinedText.includes('height'))
  ) {
    const u = getGiven('u', getGiven('v', 25));
    const thetaDeg = getGiven('theta', getGiven('angle', 45));
    const theta = (thetaDeg * Math.PI) / 180;
    const g = getGiven('g', 9.8);

    const ux = u * Math.cos(theta);
    const uy = u * Math.sin(theta);
    const flightTime = (2 * uy) / g;
    const maxHeight = (uy * uy) / (2 * g);
    const range = ux * flightTime;

    graphs.push({
      id: 'graph_projectile',
      title: `Projectile Trajectory y(x) [θ = ${thetaDeg}°]`,
      category: 'physics',
      graphType: 'projectile_motion',
      xAxis: { label: 'Horizontal Distance x', unit: 'm', min: 0, max: Math.max(range * 1.15, 10), step: Math.max(range / 5, 2) },
      yAxis: { label: 'Vertical Altitude y', unit: 'm', min: 0, max: Math.max(maxHeight * 1.3, 10), step: Math.max(maxHeight / 4, 2) },
      curves: [
        {
          id: 'traj',
          label: 'Parabolic Trajectory',
          color: '#F59E0B',
          equationText: `y(x) = x·tan(${thetaDeg}°) - (g·x²)/(2·u²·cos²(${thetaDeg}°))`,
          fnExpression: `Math.tan(${theta}) * x - (${g} * x * x) / (2 * ${u} * ${u} * Math.cos(${theta}) * Math.cos(${theta}))`,
        },
      ],
      keyPoints: [
        { x: 0, y: 0, label: 'Launch Origin', type: 'intercept' },
        { x: range / 2, y: maxHeight, label: `Apex (H_max = ${maxHeight.toFixed(1)}m)`, type: 'max' },
        { x: range, y: 0, label: `Landing (Range = ${range.toFixed(1)}m)`, type: 'root' },
      ],
      featuresExplanation: {
        gradientMeaning: 'The slope dy/dx at any point represents the tangent direction of the instantaneous velocity vector.',
        areaMeaning: 'Area under the trajectory represents the spatial domain integral.',
        physicalInterpretation: `Symmetric parabola with maximum height ${maxHeight.toFixed(1)} m at x = ${(range / 2).toFixed(1)} m, returning to ground at ${range.toFixed(1)} m after ${flightTime.toFixed(2)} seconds of flight.`,
      },
      simulation: {
        hasSimulation: true,
        type: 'projectile_2d',
        duration: range,
        objectLabel: detectedObjectLabel === 'Car' ? 'Ball' : detectedObjectLabel,
        parameters: { u, thetaDeg, g, flightTime, range, maxHeight },
      },
    });
    return graphs;
  }

  // 3. SIMPLE HARMONIC MOTION (SHM) / WAVE MOTION
  if (
    combinedText.includes('harmonic motion') ||
    combinedText.includes('shm') ||
    combinedText.includes('oscillation') ||
    combinedText.includes('pendulum') ||
    combinedText.includes('amplitude') && combinedText.includes('frequency')
  ) {
    const A = getGiven('A', getGiven('amplitude', 5));
    const T = getGiven('T', getGiven('period', 4));
    const omega = (2 * Math.PI) / T;

    graphs.push({
      id: 'graph_shm',
      title: 'Simple Harmonic Motion: x(t) = A·cos(ωt)',
      category: 'physics',
      graphType: 'shm',
      xAxis: { label: 'Time t', unit: 's', min: 0, max: T * 2.5, step: T / 2 },
      yAxis: { label: 'Displacement x', unit: 'm', min: -A * 1.3, max: A * 1.3, step: A / 2 },
      curves: [
        {
          id: 'shm_x',
          label: 'Position x(t)',
          color: '#38BDF8',
          equationText: `x(t) = ${A}·cos(${omega.toFixed(2)}t)`,
          fnExpression: `${A} * Math.cos(${omega} * t)`,
        },
        {
          id: 'shm_v',
          label: 'Velocity v(t) / ω',
          color: '#22C55E',
          dashed: true,
          equationText: `v(t) = -${(A * omega).toFixed(1)}·sin(${omega.toFixed(2)}t)`,
          fnExpression: `-${A} * Math.sin(${omega} * t)`,
        },
      ],
      keyPoints: [
        { x: 0, y: A, label: 'Positive Amplitude (+A)', type: 'max' },
        { x: T / 2, y: -A, label: 'Negative Amplitude (-A)', type: 'min' },
        { x: T / 4, y: 0, label: 'Equilibrium Crossing', type: 'root' },
      ],
      featuresExplanation: {
        gradientMeaning: 'Gradient of position x(t) yields instantaneous velocity v = dx/dt. Velocity leads displacement by 90° phase.',
        areaMeaning: 'Integral of displacement yields impulse/position accumulation.',
        physicalInterpretation: `Sinusoidal oscillation with period T = ${T.toFixed(2)} s and amplitude A = ${A.toFixed(1)} m. Potential energy is maximal at peaks, while kinetic energy is maximal at zero crossings.`,
      },
      simulation: {
        hasSimulation: true,
        type: 'shm_oscillator',
        duration: T * 2,
        parameters: { A, T, omega },
      },
    });
    return graphs;
  }

  // 4. MATHEMATICS: QUADRATIC EQUATIONS ($y = ax^2 + bx + c$)
  if (
    combinedText.includes('quadratic') ||
    combinedText.includes('parabola') ||
    combinedText.match(/[a-z]²|[a-z]\^2/)
  ) {
    // Attempt extracting a, b, c from text e.g. "3x² - 7x - 6 = 0"
    let a = 1;
    let b = -4;
    let c = 3;

    const quadMatch = combinedText.match(/([+-]?\s*\d*)\s*[a-z](?:²|\^2)\s*([+-]\s*\d*)\s*[a-z]\s*([+-]\s*\d+)/);
    if (quadMatch) {
      const parsedA = quadMatch[1].replace(/\s/g, '');
      const parsedB = quadMatch[2].replace(/\s/g, '');
      const parsedC = quadMatch[3].replace(/\s/g, '');
      a = parsedA === '' || parsedA === '+' ? 1 : parsedA === '-' ? -1 : parseFloat(parsedA) || 1;
      b = parsedB === '+' ? 1 : parsedB === '-' ? -1 : parseFloat(parsedB) || -4;
      c = parseFloat(parsedC) || 3;
    }

    const disc = b * b - 4 * a * c;
    const vertexX = -b / (2 * a);
    const vertexY = a * vertexX * vertexX + b * vertexX + c;

    const keyPoints: any[] = [
      { x: vertexX, y: vertexY, label: `Vertex (${vertexX.toFixed(2)}, ${vertexY.toFixed(2)})`, type: 'vertex' },
      { x: 0, y: c, label: `Y-Intercept (0, ${c})`, type: 'intercept' },
    ];

    if (disc >= 0) {
      const r1 = (-b + Math.sqrt(disc)) / (2 * a);
      const r2 = (-b - Math.sqrt(disc)) / (2 * a);
      keyPoints.push({ x: r1, y: 0, label: `Root x₁ = ${r1.toFixed(2)}`, type: 'root' });
      keyPoints.push({ x: r2, y: 0, label: `Root x₂ = ${r2.toFixed(2)}`, type: 'root' });
    }

    const xSpan = Math.max(Math.abs(vertexX) + 4, 6);

    graphs.push({
      id: 'graph_quad',
      title: `Quadratic Curve y = ${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c}`,
      category: 'mathematics',
      graphType: 'quadratic',
      xAxis: { label: 'x', min: vertexX - xSpan, max: vertexX + xSpan, step: 2 },
      yAxis: { label: 'y', min: Math.min(vertexY - 5, -10), max: Math.max(vertexY + 20, 20), step: 5 },
      curves: [
        {
          id: 'quad_curve',
          label: `f(x) = ${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c}`,
          color: '#22C55E',
          equationText: `y = ${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c}`,
          fnExpression: `${a} * x * x + ${b} * x + ${c}`,
        },
      ],
      keyPoints,
      featuresExplanation: {
        gradientMeaning: `Derivative slope dy/dx = ${2 * a}x ${b >= 0 ? '+' : ''}${b}. Slopes to zero at the vertex x = ${vertexX.toFixed(2)}.`,
        areaMeaning: `Definite integral ∫ (${a}x² + ${b}x + ${c}) dx represents area bounded under the curve.`,
        interceptsMeaning: `Discriminant Δ = b² - 4ac = ${disc.toFixed(1)}. ${disc > 0 ? 'Two distinct real roots' : disc === 0 ? 'One repeated real root' : 'No real roots (does not intersect x-axis)'}.`,
        physicalInterpretation: `${a > 0 ? 'Upward-opening parabola (minimum at vertex)' : 'Downward-opening parabola (maximum at vertex)'}.`,
      },
      simulation: {
        hasSimulation: true,
        type: 'curve_tracing',
        duration: xSpan * 2,
      },
    });

    return graphs;
  }

  // 5. CALCULUS / DERIVATIVES & INTEGRALS
  if (
    combinedText.includes('derivative') ||
    combinedText.includes('differentiat') ||
    combinedText.includes('integral') ||
    combinedText.includes('tangent')
  ) {
    graphs.push({
      id: 'graph_calc',
      title: 'Calculus: Function f(x) and Tangent Slope f’(x)',
      category: 'mathematics',
      graphType: 'calculus',
      xAxis: { label: 'x', min: -5, max: 5, step: 1 },
      yAxis: { label: 'y', min: -10, max: 20, step: 5 },
      curves: [
        {
          id: 'fx',
          label: 'Function f(x) = x³ - 3x',
          color: '#38BDF8',
          equationText: 'f(x) = x³ - 3x',
          fnExpression: 'x * x * x - 3 * x',
        },
        {
          id: 'dfx',
          label: "Derivative f'(x) = 3x² - 3",
          color: '#EC4899',
          dashed: true,
          equationText: "f'(x) = 3x² - 3",
          fnExpression: '3 * x * x - 3',
        },
      ],
      keyPoints: [
        { x: -1, y: 2, label: 'Local Maximum (-1, 2)', type: 'max' },
        { x: 1, y: -2, label: 'Local Minimum (1, -2)', type: 'min' },
        { x: 0, y: 0, label: 'Inflection Point (0, 0)', type: 'inflection' },
      ],
      featuresExplanation: {
        gradientMeaning: 'The derivative curve f’(x) crosses zero exactly where the parent function f(x) reaches local extrema (peaks and troughs).',
        areaMeaning: 'The area under f’(x) between x=a and x=b equals the net change f(b) - f(a) by the Fundamental Theorem of Calculus.',
      },
      simulation: {
        hasSimulation: true,
        type: 'curve_tracing',
        duration: 10,
      },
    });
    return graphs;
  }

  // 6. TRIGONOMETRIC GRAPHS
  if (
    combinedText.includes('sin(') ||
    combinedText.includes('cos(') ||
    combinedText.includes('tan(') ||
    combinedText.includes('trigonometr')
  ) {
    graphs.push({
      id: 'graph_trig',
      title: 'Trigonometric Wave: y = sin(x) & y = cos(x)',
      category: 'mathematics',
      graphType: 'trigonometric',
      xAxis: { label: 'x (radians)', min: 0, max: 2 * Math.PI, step: Math.PI / 4 },
      yAxis: { label: 'y', min: -1.5, max: 1.5, step: 0.5 },
      curves: [
        {
          id: 'trig_sin',
          label: 'y = sin(x)',
          color: '#22C55E',
          equationText: 'y = sin(x)',
          fnExpression: 'Math.sin(x)',
        },
        {
          id: 'trig_cos',
          label: 'y = cos(x)',
          color: '#38BDF8',
          dashed: true,
          equationText: 'y = cos(x)',
          fnExpression: 'Math.cos(x)',
        },
      ],
      keyPoints: [
        { x: Math.PI / 2, y: 1, label: 'sin Crest (π/2, 1)', type: 'max' },
        { x: (3 * Math.PI) / 2, y: -1, label: 'sin Trough (3π/2, -1)', type: 'min' },
      ],
      featuresExplanation: {
        gradientMeaning: 'd/dx [sin(x)] = cos(x). Derivative of sine is identically cosine, exhibiting a 90° (π/2) phase advance.',
        areaMeaning: '∫ from 0 to π of sin(x) dx = 2.0 (standard half-cycle area).',
      },
      simulation: {
        hasSimulation: true,
        type: 'wave_propagation',
        duration: 2 * Math.PI,
      },
    });
    return graphs;
  }

  // 7. LINEAR / STRAIGHT-LINE GRAPH (y = mx + c or ax + by = c)
  if (
    combinedText.includes('linear graph') ||
    combinedText.includes('straight line') ||
    combinedText.includes('slope of the line') ||
    combinedText.includes('gradient of the line') ||
    combinedText.includes('y = mx') ||
    combinedText.includes('y-intercept') ||
    combinedText.includes('x-intercept') ||
    combinedText.match(/y\s*=\s*[+-]?\s*\d*\.?\d*x\s*[+-]\s*\d+/) ||
    (combinedText.includes('graph') && (combinedText.includes('linear') || combinedText.includes('line') || combinedText.includes('intercept')))
  ) {
    let m = 2;
    let c = 1;
    const lineMatch = combinedText.match(/y\s*=\s*([+-]?\s*\d*\.?\d*)\s*x\s*([+-]\s*\d+\.?\d*)?/i);
    if (lineMatch) {
      const rawM = (lineMatch[1] || '').replace(/\s/g, '');
      const rawC = (lineMatch[2] || '').replace(/\s/g, '');
      m = rawM === '' || rawM === '+' ? 1 : rawM === '-' ? -1 : parseFloat(rawM) || 2;
      c = rawC ? parseFloat(rawC) : 0;
    }

    const xInt = m !== 0 ? -c / m : 0;
    const xRange = Math.max(Math.abs(xInt) + 6, 8);

    graphs.push({
      id: 'graph_linear',
      title: `Straight Line Graph: y = ${m}x ${c >= 0 ? '+' : ''}${c}`,
      category: 'mathematics',
      graphType: 'linear',
      xAxis: { label: 'x', min: -xRange, max: xRange, step: 2 },
      yAxis: {
        label: 'y',
        min: Math.min(-xRange * Math.abs(m) + c, -10),
        max: Math.max(xRange * Math.abs(m) + c, 10),
        step: 5,
      },
      curves: [
        {
          id: 'linear_line',
          label: `y = ${m}x ${c >= 0 ? '+' : ''}${c}`,
          color: '#22C55E',
          equationText: `y = ${m}x ${c >= 0 ? '+' : ''}${c}`,
          fnExpression: `${m} * x + ${c}`,
        },
      ],
      keyPoints: [
        { x: 0, y: c, label: `Y-Intercept (0, ${c})`, type: 'intercept' },
        ...(m !== 0 ? [{ x: xInt, y: 0, label: `X-Intercept (${xInt.toFixed(2)}, 0)`, type: 'root' as const }] : []),
      ],
      featuresExplanation: {
        gradientMeaning: `The constant slope (gradient) is m = Δy/Δx = ${m}. Every 1 unit increase in x causes a ${m} unit change in y.`,
        interceptsMeaning: `Crosses y-axis at (0, ${c}) and x-axis at (${xInt.toFixed(2)}, 0).`,
        physicalInterpretation: `${m > 0 ? 'Positive upward slope' : m < 0 ? 'Negative downward slope' : 'Horizontal line'} with constant rate of change.`,
      },
      simulation: {
        hasSimulation: true,
        type: 'curve_tracing',
        duration: xRange * 2,
      },
    });
    return graphs;
  }

  // 8. CARTESIAN CIRCLE GRAPH IN COORDINATE GEOMETRY (x² + y² = r²)
  if (
    (combinedText.includes('x² + y²') || combinedText.includes('x^2 + y^2') || combinedText.includes('circle equation') || combinedText.includes('equation of a circle')) &&
    (combinedText.includes('graph') || combinedText.includes('plot') || combinedText.includes('cartesian') || combinedText.includes('coordinate') || combinedText.includes('axis') || combinedText.includes('center'))
  ) {
    let r = 5;
    const rMatch = combinedText.match(/(?:x²\s*\+\s*y²|x\^2\s*\+\s*y\^2)\s*=\s*(\d+)/i);
    if (rMatch && rMatch[1]) {
      const rSq = parseFloat(rMatch[1]);
      if (rSq > 0) r = Math.sqrt(rSq);
    }
    const rVal = Math.round(r * 10) / 10;
    const span = Math.ceil(rVal * 1.3);

    graphs.push({
      id: 'graph_circle_cartesian',
      title: `Cartesian Circle Graph: x² + y² = ${(rVal * rVal).toFixed(0)} (Radius r = ${rVal})`,
      category: 'mathematics',
      graphType: 'conic',
      xAxis: { label: 'x', min: -span, max: span, step: 2 },
      yAxis: { label: 'y', min: -span, max: span, step: 2 },
      curves: [
        {
          id: 'circle_top',
          label: `Upper Semicircle y = +√(${rVal * rVal} - x²)`,
          color: '#38BDF8',
          equationText: `y = +\\sqrt{${(rVal * rVal).toFixed(0)} - x^2}`,
          fnExpression: `Math.sqrt(Math.max(0, ${rVal * rVal} - x * x))`,
        },
        {
          id: 'circle_bottom',
          label: `Lower Semicircle y = -√(${rVal * rVal} - x²)`,
          color: '#38BDF8',
          dashed: true,
          equationText: `y = -\\sqrt{${(rVal * rVal).toFixed(0)} - x^2}`,
          fnExpression: `-Math.sqrt(Math.max(0, ${rVal * rVal} - x * x))`,
        },
      ],
      keyPoints: [
        { x: 0, y: 0, label: 'Center (0, 0)', type: 'intercept' },
        { x: rVal, y: 0, label: `Right (${rVal}, 0)`, type: 'intercept' },
        { x: -rVal, y: 0, label: `Left (-${rVal}, 0)`, type: 'intercept' },
        { x: 0, y: rVal, label: `Top (0, ${rVal})`, type: 'max' },
        { x: 0, y: -rVal, label: `Bottom (0, -${rVal})`, type: 'min' },
      ],
      featuresExplanation: {
        gradientMeaning: 'Slope of tangent to the circle at (x, y) is dy/dx = -x/y (perpendicular to radius vector).',
        areaMeaning: `Enclosed area = πr² = ${(Math.PI * rVal * rVal).toFixed(2)} square units. Circumference = 2πr = ${(2 * Math.PI * rVal).toFixed(2)} units.`,
        interceptsMeaning: `X-intercepts at (±${rVal}, 0), Y-intercepts at (0, ±${rVal}).`,
        physicalInterpretation: `Locus of all points equidistant (r = ${rVal}) from the origin (0, 0) on the 2D Cartesian plane.`,
      },
      simulation: {
        hasSimulation: true,
        type: 'curve_tracing',
        duration: span * 2,
      },
    });
    return graphs;
  }

  // 9. GENERAL GRAPH / FUNCTION GRAPHING FALLBACK
  if (
    combinedText.includes('draw the graph') ||
    combinedText.includes('plot the graph') ||
    combinedText.includes('sketch the graph') ||
    combinedText.includes('graph of the function') ||
    combinedText.includes('draw a graph') ||
    combinedText.includes('plot a graph') ||
    combinedText.includes('graph of')
  ) {
    graphs.push({
      id: 'graph_general_func',
      title: 'Function Graph f(x) on Cartesian Coordinate Axes',
      category: 'mathematics',
      graphType: 'linear',
      xAxis: { label: 'x', min: -8, max: 8, step: 2 },
      yAxis: { label: 'y', min: -10, max: 15, step: 5 },
      curves: [
        {
          id: 'curve_gen',
          label: 'f(x)',
          color: '#22C55E',
          equationText: 'y = f(x)',
          fnExpression: '2 * x + 1',
        },
      ],
      keyPoints: [
        { x: 0, y: 1, label: 'Y-Intercept (0, 1)', type: 'intercept' },
        { x: -0.5, y: 0, label: 'X-Intercept (-0.5, 0)', type: 'root' },
      ],
      featuresExplanation: {
        gradientMeaning: 'Slope of the graph represents the rate of change dy/dx.',
        areaMeaning: 'Area under the curve represents the definite integral.',
        physicalInterpretation: 'Plotted points on the Cartesian X-Y grid illustrating function behavior.',
      },
      simulation: {
        hasSimulation: true,
        type: 'curve_tracing',
        duration: 16,
      },
    });
    return graphs;
  }

  return graphs;
}
