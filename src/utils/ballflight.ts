// src/utils/ballflight.ts
// Pitch & Putt balvlucht-correcties voor temperatuur + wind (op 10 m van MET Norway)
// Output: [{ hole, normaal, aangepast, richt }] waarbij richt = "2L" | "1R" | "—"

// ==================
// Afstelbare constanten
// ==================
const ALPHA_TEMP = 0.0017;    // ~1% per +6°C t.o.v. 15°C
const K_TAIL = 0.008;         // windfactor tailwind
const K_HEAD = 0.010;         // windfactor headwind
const CLAMP_MIN = 0.8;        // min. carry factor
const CLAMP_MAX = 1.2;        // max. carry factor
const FLIGHTTIME_FACTOR = 0.04; // s/m; vluchttijd-heuristiek
const GAMMA_SIDE = 0.3;       // zijwind-effectiviteit (0.6 → realistischer 0.3)
const DRIFT_CAP = 3;          // max richtcorrectie in meters (optioneel)

// ==================
// Types
// ==================
export type HoleInput = {
  hole: number;           // 1..18
  length_m: number;       // normale lengte in meters
  bearing_deg?: number;   // Azimut tee→green in graden (0=N, 90=E)
  relative_wind_deg?: number; // Relatieve hoek φ (0=mee, +90=van links, -90=van rechts)
};

export type WeatherInput = {
  T_c: number;            // temperatuur in °C
  wind_speed_10m: number; // m/s (MET Norway)
  wind_dir_from_deg: number; // windrichting FROM in graden, 0=N
};

export type TableRow = {
  hole: number;
  normaal: number;    // m
  aangepast: number;  // m (afgerond)
  richt: string;      // "2L" | "1R" | "—"
};

// ==================
// Helpers
// ==================
const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b);
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** signed angle from a->b in [-180,180], in degrees; a,b are bearings (0=N, cw positive) */
function signedAngleDeg(a_deg: number, b_deg: number): number {
  const d = ((b_deg - a_deg + 540) % 360) - 180;
  return d; // + = links, - = rechts
}

/** 1/7-power law voor wind op apex-hoogte */
function scaleWindToApex(v10: number, L: number): number {
  const z_apex = clamp(0.25 * L, 8, 22);
  return v10 * Math.pow(z_apex / 10, 0.14);
}

/** Temperatuurfactor */
function temperatureFactor(T_c: number): number {
  return 1 + ALPHA_TEMP * (T_c - 15);
}

/** Windfactor op carry */
function windFactorOnCarry(v_tail: number): number {
  const f = 1 + (v_tail >= 0 ? K_TAIL * v_tail : K_HEAD * v_tail);
  return clamp(f, CLAMP_MIN, CLAMP_MAX);
}

/** Vluchttijd-heuristiek */
function flightTimeSeconds(L: number): number {
  return FLIGHTTIME_FACTOR * L;
}

/** Laterale drift in meters */
function lateralDriftMeters(v_side: number, L: number): number {
  const t = flightTimeSeconds(L);
  const drift = v_side * t * GAMMA_SIDE;
  return clamp(drift, -DRIFT_CAP, DRIFT_CAP); // optioneel capped
}

// ==================
// Main
// ==================
export function computeAdjustedTable(
  holes: HoleInput[],
  weather: WeatherInput,
  opts?: { roundMeters?: number }
): TableRow[] {
  const { T_c, wind_speed_10m, wind_dir_from_deg } = weather;
  const roundMeters = opts?.roundMeters ?? 1;

  // MET geeft "from". Voor vectorprojectie is "to"-richting handig:
  const wind_to_deg = (wind_dir_from_deg + 180) % 360;

  return holes.map((h) => {
    const L = h.length_m;

    // 1) Temperatuur
    const fT = temperatureFactor(T_c);

    // 2) Wind op apex
    const v_apex = scaleWindToApex(wind_speed_10m, L);

    // 3) Relatieve hoek φ
    let phi_deg: number;
    if (typeof h.bearing_deg === 'number') {
      phi_deg = signedAngleDeg(h.bearing_deg, wind_to_deg);
    } else if (typeof h.relative_wind_deg === 'number') {
      phi_deg = h.relative_wind_deg;
    } else {
      phi_deg = 0;
    }

    const v_tail = v_apex * Math.cos(toRad(phi_deg));
    const v_side = v_apex * Math.sin(toRad(phi_deg));

    // 4) Windfactor
    const fW = windFactorOnCarry(v_tail);

    // 5) Aangepaste lengte
    const adjusted = Math.round((L * fT * fW) / roundMeters) * roundMeters;

    // 6) Richtadvies
    const drift = lateralDriftMeters(v_side, L);
    const aim_m = Math.round(Math.abs(drift));
    let richt: string = '—';
    if (aim_m > 0) {
      richt = drift > 0 ? `${aim_m}R` : `${aim_m}L`;
    }

    return {
      hole: h.hole,
      normaal: Math.round(L),
      aangepast: adjusted,
      richt,
    };
  });
}
