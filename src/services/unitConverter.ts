import { UnitCategory } from '../types';
import { formatNum } from './mathEngine';

export const UNIT_CATEGORIES: UnitCategory[] = [
  // 1. Length
  {
    name: 'Length',
    icon: 'Ruler',
    baseUnit: 'meter (m)',
    units: [
      { id: 'm', name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'mm', name: 'Millimeter', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'um', name: 'Micrometer (µm)', symbol: 'µm', toBase: (v) => v * 1e-6, fromBase: (v) => v * 1e6 },
      { id: 'nm', name: 'Nanometer (nm)', symbol: 'nm', toBase: (v) => v * 1e-9, fromBase: (v) => v * 1e9 },
      { id: 'mile', name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: 'yard', name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'foot', name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'inch', name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'nmi', name: 'Nautical Mile', symbol: 'NM', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    ],
  },

  // 2. Mass
  {
    name: 'Mass',
    icon: 'Weight',
    baseUnit: 'kilogram (kg)',
    units: [
      { id: 'kg', name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', name: 'Gram', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'mg', name: 'Milligram', symbol: 'mg', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 'tonne', name: 'Metric Tonne', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'lb', name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
    ],
  },

  // 3. Time
  {
    name: 'Time',
    icon: 'Clock',
    baseUnit: 'second (s)',
    units: [
      { id: 's', name: 'Second', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ms', name: 'Millisecond', symbol: 'ms', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'min', name: 'Minute', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'hr', name: 'Hour', symbol: 'h', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'day', name: 'Day', symbol: 'd', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'yr', name: 'Year (365d)', symbol: 'yr', toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
    ],
  },

  // 4. Area
  {
    name: 'Area',
    icon: 'Maximize2',
    baseUnit: 'square meter (m²)',
    units: [
      { id: 'm2', name: 'Square Meter', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km2', name: 'Square Kilometer', symbol: 'km²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'cm2', name: 'Square Centimeter', symbol: 'cm²', toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
      { id: 'ha', name: 'Hectare', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { id: 'acre', name: 'Acre', symbol: 'acre', toBase: (v) => v * 4046.856, fromBase: (v) => v / 4046.856 },
      { id: 'ft2', name: 'Square Foot', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    ],
  },

  // 5. Volume
  {
    name: 'Volume',
    icon: 'Box',
    baseUnit: 'cubic meter (m³)',
    units: [
      { id: 'm3', name: 'Cubic Meter', symbol: 'm³', toBase: (v) => v, fromBase: (v) => v },
      { id: 'l', name: 'Liter / Litre', symbol: 'L', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'ml', name: 'Milliliter / cm³', symbol: 'mL (cm³)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 'gal_us', name: 'US Gallon', symbol: 'gal', toBase: (v) => v * 0.00378541, fromBase: (v) => v / 0.00378541 },
      { id: 'gal_uk', name: 'Imperial Gallon', symbol: 'imp gal', toBase: (v) => v * 0.00454609, fromBase: (v) => v / 0.00454609 },
    ],
  },

  // 6. Speed
  {
    name: 'Speed',
    icon: 'Zap',
    baseUnit: 'meters per second (m/s)',
    units: [
      { id: 'ms', name: 'Meters per second', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kmh', name: 'Kilometers per hour', symbol: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'mph', name: 'Miles per hour', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: 'knot', name: 'Knot', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
      { id: 'c', name: 'Speed of Light (c)', symbol: 'c', toBase: (v) => v * 299792458, fromBase: (v) => v / 299792458 },
    ],
  },

  // 7. Acceleration
  {
    name: 'Acceleration',
    icon: 'TrendingUp',
    baseUnit: 'm/s²',
    units: [
      { id: 'ms2', name: 'Meters per second²', symbol: 'm/s²', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', name: 'Standard Earth Gravity (g)', symbol: 'g', toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 },
      { id: 'kmh2', name: 'Kilometers per hour²', symbol: 'km/h²', toBase: (v) => v / 12960, fromBase: (v) => v * 12960 },
      { id: 'fts2', name: 'Feet per second²', symbol: 'ft/s²', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
  },

  // 8. Force
  {
    name: 'Force',
    icon: 'Shield',
    baseUnit: 'Newton (N)',
    units: [
      { id: 'N', name: 'Newton', symbol: 'N', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kN', name: 'Kilonewton', symbol: 'kN', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'dyne', name: 'Dyne (cgs)', symbol: 'dyn', toBase: (v) => v * 1e-5, fromBase: (v) => v * 1e5 },
      { id: 'lbf', name: 'Pound-force', symbol: 'lbf', toBase: (v) => v * 4.448222, fromBase: (v) => v / 4.448222 },
      { id: 'kgf', name: 'Kilogram-force', symbol: 'kgf', toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 },
    ],
  },

  // 9. Energy
  {
    name: 'Energy',
    icon: 'Flame',
    baseUnit: 'Joule (J)',
    units: [
      { id: 'J', name: 'Joule', symbol: 'J', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kJ', name: 'Kilojoule', symbol: 'kJ', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cal', name: 'Calorie (cal)', symbol: 'cal', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { id: 'kcal', name: 'Kilocalorie (kcal)', symbol: 'kcal', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { id: 'kWh', name: 'Kilowatt-hour', symbol: 'kWh', toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
      { id: 'eV', name: 'Electronvolt', symbol: 'eV', toBase: (v) => v * 1.602176634e-19, fromBase: (v) => v / 1.602176634e-19 },
      { id: 'btu', name: 'British Thermal Unit', symbol: 'BTU', toBase: (v) => v * 1055.06, fromBase: (v) => v / 1055.06 },
    ],
  },

  // 10. Power
  {
    name: 'Power',
    icon: 'Cpu',
    baseUnit: 'Watt (W)',
    units: [
      { id: 'W', name: 'Watt', symbol: 'W', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kW', name: 'Kilowatt', symbol: 'kW', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'MW', name: 'Megawatt', symbol: 'MW', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'hp', name: 'Horsepower (metric)', symbol: 'hp', toBase: (v) => v * 735.49875, fromBase: (v) => v / 735.49875 },
      { id: 'hp_eng', name: 'Horsepower (mechanical)', symbol: 'hp (mech)', toBase: (v) => v * 745.69987, fromBase: (v) => v / 745.69987 },
    ],
  },

  // 11. Pressure
  {
    name: 'Pressure',
    icon: 'Gauge',
    baseUnit: 'Pascal (Pa)',
    units: [
      { id: 'Pa', name: 'Pascal / N/m²', symbol: 'Pa (N/m²)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kPa', name: 'Kilopascal', symbol: 'kPa', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'atm', name: 'Atmosphere (std)', symbol: 'atm', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      { id: 'bar', name: 'Bar', symbol: 'bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { id: 'mmHg', name: 'Millimeter of Mercury (Torr)', symbol: 'mmHg', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
      { id: 'psi', name: 'Pounds per square inch', symbol: 'psi', toBase: (v) => v * 6894.757, fromBase: (v) => v / 6894.757 },
    ],
  },

  // 12. Temperature
  {
    name: 'Temperature',
    icon: 'Thermometer',
    baseUnit: 'Kelvin (K)',
    units: [
      { id: 'C', name: 'Celsius', symbol: '°C', toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
      { id: 'K', name: 'Kelvin', symbol: 'K', toBase: (v) => v, fromBase: (v) => v },
      { id: 'F', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (v) => ((v - 273.15) * 9) / 5 + 32 },
    ],
  },

  // 13. Frequency
  {
    name: 'Frequency',
    icon: 'Radio',
    baseUnit: 'Hertz (Hz)',
    units: [
      { id: 'Hz', name: 'Hertz', symbol: 'Hz', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kHz', name: 'Kilohertz', symbol: 'kHz', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'MHz', name: 'Megahertz', symbol: 'MHz', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'GHz', name: 'Gigahertz', symbol: 'GHz', toBase: (v) => v * 1e9, fromBase: (v) => v / 1e9 },
      { id: 'rpm', name: 'Revolutions per minute', symbol: 'rpm', toBase: (v) => v / 60, fromBase: (v) => v * 60 },
    ],
  },

  // 14. Electrical Charge
  {
    name: 'Charge',
    icon: 'BatteryCharging',
    baseUnit: 'Coulomb (C)',
    units: [
      { id: 'C', name: 'Coulomb', symbol: 'C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'mC', name: 'Millicoulomb', symbol: 'mC', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'uC', name: 'Microcoulomb', symbol: 'µC', toBase: (v) => v * 1e-6, fromBase: (v) => v * 1e6 },
      { id: 'Ah', name: 'Ampere-hour', symbol: 'Ah', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'mAh', name: 'Milliampere-hour', symbol: 'mAh', toBase: (v) => v * 3.6, fromBase: (v) => v / 3.6 },
    ],
  },

  // 15. Voltage
  {
    name: 'Voltage',
    icon: 'Activity',
    baseUnit: 'Volt (V)',
    units: [
      { id: 'V', name: 'Volt', symbol: 'V', toBase: (v) => v, fromBase: (v) => v },
      { id: 'mV', name: 'Millivolt', symbol: 'mV', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'kV', name: 'Kilovolt', symbol: 'kV', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'MV', name: 'Megavolt', symbol: 'MV', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    ],
  },

  // 16. Resistance
  {
    name: 'Resistance',
    icon: 'Sliders',
    baseUnit: 'Ohm (Ω)',
    units: [
      { id: 'ohm', name: 'Ohm', symbol: 'Ω', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kohm', name: 'Kilo-ohm', symbol: 'kΩ', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'Mohm', name: 'Mega-ohm', symbol: 'MΩ', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'mohm', name: 'Milliohm', symbol: 'mΩ', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    ],
  },
];

export function convertUnit(
  categoryName: string,
  fromUnitId: string,
  toUnitId: string,
  value: number
): { result: number; steps: string[]; formula: string } {
  const cat = UNIT_CATEGORIES.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  if (!cat) throw new Error(`Category "${categoryName}" not found.`);

  const fromUnit = cat.units.find((u) => u.id === fromUnitId);
  const toUnit = cat.units.find((u) => u.id === toUnitId);

  if (!fromUnit || !toUnit) {
    throw new Error('Invalid units specified for conversion.');
  }

  // Convert to base unit then to target unit
  const baseVal = fromUnit.toBase(value);
  const targetVal = toUnit.fromBase(baseVal);

  const steps: string[] = [
    `Category: ${cat.name}`,
    `From: ${value} ${fromUnit.symbol} (${fromUnit.name})`,
    `Standard Base (${cat.baseUnit}): ${value} ${fromUnit.symbol} = ${formatNum(baseVal, 6)}`,
    `Convert to Target (${toUnit.symbol}): ${formatNum(baseVal, 6)} -> ${formatNum(targetVal, 6)} ${toUnit.symbol}`,
  ];

  return {
    result: targetVal,
    steps,
    formula: `1 ${fromUnit.symbol} → ${formatNum(toUnit.fromBase(fromUnit.toBase(1)), 4)} ${toUnit.symbol}`,
  };
}
