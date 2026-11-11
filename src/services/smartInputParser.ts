import { StepSolution } from '../types';
import { solveSingleVariableEquation } from './equationSolver';
import { evaluateExpression, calculateStatistics, formatNum } from './mathEngine';
import { PHYSICS_FORMULAS, solvePhysicsFormula } from './physicsEngine';
import { UNIT_CATEGORIES, convertUnit } from './unitConverter';

/**
 * Parses natural language input and executes the corresponding math or physics calculation
 */
export function parseSmartInput(query: string): StepSolution {
  const q = query.trim();
  if (!q) {
    throw new Error('Please enter a math or physics expression, equation, or question.');
  }

  // 1. Direct Equation solver: "solve 2x + 7 = 19" or "2x + 5 = 15"
  const eqMatch = q.match(/(?:solve\s+)?([0-9a-zA-Z\s\+\-\*\/\^\(\)]+=[\s0-9a-zA-Z\+\-\*\/\^\(\)]+)/i);
  if (eqMatch && !q.toLowerCase().startsWith('convert')) {
    const rawEq = eqMatch[1].trim();
    return solveSingleVariableEquation(rawEq);
  }

  // 2. Statistics: "mean of 12, 15, 20" or "statistics for 4, 8, 15, 16"
  if (/^(?:find\s+)?(?:mean|median|mode|statistics|average)\s+(?:of|for)?\s*([0-9\s,\.]+)/i.test(q)) {
    const numsStr = q.replace(/^(?:find\s+)?(?:mean|median|mode|statistics|average)\s+(?:of|for)?/i, '').trim();
    return calculateStatistics(numsStr);
  }

  // 3. Unit Conversion: "convert 100 km/h to m/s" or "100 km to miles"
  const convMatch = q.match(/(?:convert\s+)?([0-9\.]+)\s*([a-zA-Z\/²³°µ]+)\s+(?:to|into|in)\s+([a-zA-Z\/²³°µ]+)/i);
  if (convMatch) {
    const val = parseFloat(convMatch[1]);
    const fromSymbol = convMatch[2].trim();
    const toSymbol = convMatch[3].trim();

    // Find category that has matching symbols
    for (const cat of UNIT_CATEGORIES) {
      const fromU = cat.units.find(
        (u) => u.symbol.toLowerCase() === fromSymbol.toLowerCase() || u.id.toLowerCase() === fromSymbol.toLowerCase()
      );
      const toU = cat.units.find(
        (u) => u.symbol.toLowerCase() === toSymbol.toLowerCase() || u.id.toLowerCase() === toSymbol.toLowerCase()
      );
      if (fromU && toU) {
        const res = convertUnit(cat.name, fromU.id, toU.id, val);
        return {
          title: `Unit Conversion: ${cat.name}`,
          category: 'Unit Converter',
          subCategory: cat.name,
          problemStatement: `Convert ${val} ${fromU.symbol} to ${toU.symbol}`,
          formula: res.formula,
          substitution: `${val} ${fromU.symbol}`,
          steps: res.steps,
          finalAnswer: `${formatNum(res.result, 6)} ${toU.symbol}`,
          unit: toU.symbol,
        };
      }
    }
  }

  // 4. Kinetic Energy: "calculate kinetic energy of a 5 kg object moving at 10 m/s"
  if (/kinetic\s+energy/i.test(q)) {
    const massMatch = q.match(/([0-9\.]+)\s*(?:kg|kilograms?|g)/i) || q.match(/m\s*=\s*([0-9\.]+)/i);
    const velMatch = q.match(/([0-9\.]+)\s*(?:m\/s|meters?\s*per\s*second|mps)/i) || q.match(/v\s*=\s*([0-9\.]+)/i);
    if (massMatch && velMatch) {
      let m = parseFloat(massMatch[1]);
      if (/g\b/i.test(massMatch[0]) && !/kg/i.test(massMatch[0])) m = m / 1000;
      const v = parseFloat(velMatch[1]);
      return solvePhysicsFormula('kinetic_energy', 'KE', { m, v });
    }
  }

  // 5. Acceleration: "find acceleration when v=20, u=5 and t=3"
  if (/acceleration/i.test(q)) {
    const vMatch = q.match(/v\s*=\s*([0-9\.\-]+)/i);
    const uMatch = q.match(/u\s*=\s*([0-9\.\-]+)/i);
    const tMatch = q.match(/t\s*=\s*([0-9\.]+)/i);
    if (vMatch && uMatch && tMatch) {
      return solvePhysicsFormula('acceleration', 'a', {
        v: parseFloat(vMatch[1]),
        u: parseFloat(uMatch[1]),
        t: parseFloat(tMatch[1]),
      });
    }
  }

  // 6. Force: "calculate force for mass 15kg acceleration 2m/s^2"
  if (/force/i.test(q)) {
    const mMatch = q.match(/mass\s*(?:of|=|is)?\s*([0-9\.]+)/i) || q.match(/([0-9\.]+)\s*kg/i) || q.match(/m\s*=\s*([0-9\.]+)/i);
    const aMatch = q.match(/accel(?:eration)?\s*(?:of|=|is)?\s*([0-9\.\-]+)/i) || q.match(/([0-9\.\-]+)\s*m\/s\^?2/i) || q.match(/a\s*=\s*([0-9\.\-]+)/i);
    if (mMatch && aMatch) {
      return solvePhysicsFormula('newton_second_law', 'F', {
        m: parseFloat(mMatch[1]),
        a: parseFloat(aMatch[1]),
      });
    }
  }

  // 7. Speed: "find speed if distance is 120m and time is 10s"
  if (/speed/i.test(q)) {
    const dMatch = q.match(/dist(?:ance)?\s*(?:of|=|is)?\s*([0-9\.]+)/i) || q.match(/([0-9\.]+)\s*m\b/i) || q.match(/d\s*=\s*([0-9\.]+)/i);
    const tMatch = q.match(/time\s*(?:of|=|is)?\s*([0-9\.]+)/i) || q.match(/([0-9\.]+)\s*s\b/i) || q.match(/t\s*=\s*([0-9\.]+)/i);
    if (dMatch && tMatch) {
      return solvePhysicsFormula('speed_dist_time', 'v', {
        d: parseFloat(dMatch[1]),
        t: parseFloat(tMatch[1]),
      });
    }
  }

  // 8. Power: "calculate power when work is 500J and time is 25s"
  if (/power/i.test(q)) {
    const wMatch = q.match(/work\s*(?:of|=|is)?\s*([0-9\.]+)/i) || q.match(/([0-9\.]+)\s*J\b/i) || q.match(/W\s*=\s*([0-9\.]+)/i);
    const tMatch = q.match(/time\s*(?:of|=|is)?\s*([0-9\.]+)/i) || q.match(/([0-9\.]+)\s*s\b/i) || q.match(/t\s*=\s*([0-9\.]+)/i);
    if (wMatch && tMatch) {
      return solvePhysicsFormula('power', 'P', {
        W: parseFloat(wMatch[1]),
        t: parseFloat(tMatch[1]),
      });
    }
  }

  // 9. Ohm's law: "voltage when current is 5A and resistance is 44 ohms"
  if (/voltage|current|resistance|ohm/i.test(q)) {
    const iMatch = q.match(/current\s*(?:of|=|is)?\s*([0-9\.]+)/i) || q.match(/([0-9\.]+)\s*A\b/i) || q.match(/I\s*=\s*([0-9\.]+)/i);
    const rMatch = q.match(/resist(?:ance)?\s*(?:of|=|is)?\s*([0-9\.]+)/i) || q.match(/([0-9\.]+)\s*(?:ohm|Ω)/i) || q.match(/R\s*=\s*([0-9\.]+)/i);
    if (iMatch && rMatch) {
      return solvePhysicsFormula('ohms_law', 'V', {
        I: parseFloat(iMatch[1]),
        R: parseFloat(rMatch[1]),
      });
    }
  }

  // 10. Default: Scientific arithmetic evaluation: e.g. "sin(30) + cos(60)" or "4 * (5 + 3)"
  try {
    const cleanExpr = q.replace(/^(?:calculate|evaluate|solve|what is)\s+/i, '');
    const evalRes = evaluateExpression(cleanExpr);
    return {
      title: 'Expression Evaluation',
      category: 'Scientific',
      problemStatement: cleanExpr,
      formula: cleanExpr,
      substitution: cleanExpr,
      steps: evalRes.steps,
      finalAnswer: `${formatNum(evalRes.result, 6)}`,
    };
  } catch (err: any) {
    throw new Error(
      `Could not interpret query "${query}". Try equations like "solve 2x + 5 = 15", physics like "find acceleration when v=20, u=5 and t=3", or conversions like "convert 100 km/h to m/s".`
    );
  }
}
