import type { Guess } from "../components/GuessControls";

export function makeKernel(guess: Guess, size: number): Float64Array[] {
    const k = zeros2D(size);
    const center = size >> 1;
    const { type, params } = guess;

    if (type === "gaussian") {
        const r = (params.radius ?? 3) as number;
        const sigma = r;
        let sum = 0;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const v = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
                k[y][x] = v;
                sum += v;
            }
        }
        normalize2D(k, sum);
    } else if (type === "box") {
        const s = (params.size ?? 3) as number;
        const half = Math.floor(s / 2);
        let sum = 0;
        for (let y = -half; y <= half; y++)
            for (let x = -half; x <= half; x++) {
                k[center + y][center + x] = 1;
                sum += 1;
            }
        normalize2D(k, sum);
    } else if (type === "defocus") {
        const r = (params.radius ?? 3) as number;
        const r2 = r * r;
        let sum = 0;
        for (let y = -r; y <= r; y++)
            for (let x = -r; x <= r; x++) {
                if (x * x + y * y <= r2) {
                    k[center + y][center + x] = 1;
                    sum += 1;
                }
            }
        normalize2D(k, sum);
    } else if (type === "motion") {
        const length = (params.length ?? 9) as number;
        const angleDeg = (params.angle ?? 0) as number;
        const angle = (angleDeg * Math.PI) / 180;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        let sum = 0;
        for (
            let i = -Math.floor(length / 2);
            i <= Math.floor(length / 2);
            i++
        ) {
            const x = Math.round(center + dx * i);
            const y = Math.round(center + dy * i);
            if (x >= 0 && x < size && y >= 0 && y < size) {
                k[y][x] = 1;
                sum += 1;
            }
        }
        normalize2D(k, sum);
    }

    return k;
}

export function zeros2D(size: number): Float64Array[] {
    return Array.from({ length: size }, () => new Float64Array(size));
}

function normalize2D(arr: Float64Array[], sum?: number) {
    const s =
        sum ??
        arr.reduce((acc, row) => acc + row.reduce((a, v) => a + v, 0), 0);
    if (s === 0) return;
    for (let y = 0; y < arr.length; y++)
        for (let x = 0; x < arr.length; x++) arr[y][x] /= s;
}
