// Band centers in normalized frequency f in [0, 0.5], DC→Nyquist
export const BAND_CENTERS: number[] = [0.0, 0.05, 0.1, 0.2, 0.35, 0.5];

export type Bands = [number, number, number, number, number, number];

export function clampBands(b: number[]): Bands {
    const out = b.map((v) => Math.min(1.2, Math.max(0.05, v)));
    return out as Bands;
}

export function normalizeDC(bands: Bands): Bands {
    // Ensure H(0) = 1 by dividing by g at f=0 (interpolated)
    const h0 = sampleH(0, bands);
    if (h0 === 0) return bands;
    const scaled = bands.map((v) => v / h0) as Bands;
    return scaled;
}

export function sampleH(f: number, bands: Bands): number {
    // cosine interpolation between the two surrounding band centers
    if (f <= BAND_CENTERS[0]) return bands[0];
    if (f >= BAND_CENTERS[5]) return bands[5];
    let i = 0;
    for (; i < BAND_CENTERS.length - 1; i++) {
        const a = BAND_CENTERS[i];
        const b = BAND_CENTERS[i + 1];
        if (f >= a && f <= b) {
            const t = (f - a) / (b - a);
            const t2 = (1 - Math.cos(Math.PI * t)) / 2; // cosine smoothstep
            return bands[i] * (1 - t2) + bands[i + 1] * t2;
        }
    }
    return bands[bands.length - 1];
}

export function buildKernelMagnitude2D(
    size: number,
    bands: Bands
): Float64Array[] {
    const out: Float64Array[] = Array.from(
        { length: size },
        () => new Float64Array(size)
    );
    const half = size / 2;
    const normBands = normalizeDC(bands);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const fu = Math.abs(x - half) / size; // 0..0.5
            const fv = Math.abs(y - half) / size; // 0..0.5
            const hx = sampleH(fu, normBands);
            const hy = sampleH(fv, normBands);
            out[y][x] = hx * hy;
        }
    }
    return out;
}

export function randomMonotoneBands(rng = Math.random): Bands {
    // Start at 1.0 and decrease towards ~0.2 with slight randomness, non-increasing
    const target: number[] = [1.0];
    for (let i = 1; i < 6; i++) {
        const prev = target[i - 1];
        const drop = 0.05 + rng() * 0.2; // 0.05..0.25 drop per band
        target.push(Math.max(0.2, prev - drop));
    }
    return clampBands(target) as Bands;
}
