export function fft1D(real: Float64Array, imag: Float64Array): void {
    const n = real.length;
    const levels = Math.floor(Math.log2(n));
    if (1 << levels !== n) throw new Error("Length must be power of two");
    const bitReverse = (v: number) => {
        let r = 0;
        for (let i = 0; i < levels; i++) {
            r = (r << 1) | (v & 1);
            v >>= 1;
        }
        return r;
    };
    for (let i = 0; i < n; i++) {
        const j = bitReverse(i);
        if (j > i) {
            [real[i], real[j]] = [real[j], real[i]];
            [imag[i], imag[j]] = [imag[j], imag[i]];
        }
    }
    for (let size = 2; size <= n; size <<= 1) {
        const half = size >> 1;
        const step = (2 * Math.PI) / size;
        for (let i = 0; i < n; i += size) {
            for (let j = 0; j < half; j++) {
                const k = j * step;
                const cos = Math.cos(-k);
                const sin = Math.sin(-k);
                const a = i + j;
                const b = a + half;
                const tr = real[b] * cos - imag[b] * sin;
                const ti = real[b] * sin + imag[b] * cos;
                real[b] = real[a] - tr;
                imag[b] = imag[a] - ti;
                real[a] += tr;
                imag[a] += ti;
            }
        }
    }
}

export function fft2D(
    real: Float64Array[],
    imag: Float64Array[],
    size: number
): void {
    for (let y = 0; y < size; y++) fft1D(real[y], imag[y]);
    for (let x = 0; x < size; x++) {
        const colR = new Float64Array(size);
        const colI = new Float64Array(size);
        for (let y = 0; y < size; y++) {
            colR[y] = real[y][x];
            colI[y] = imag[y][x];
        }
        fft1D(colR, colI);
        for (let y = 0; y < size; y++) {
            real[y][x] = colR[y];
            imag[y][x] = colI[y];
        }
    }
}

export function ifft2D(
    real: Float64Array[],
    imag: Float64Array[],
    size: number
): void {
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) imag[y][x] = -imag[y][x];
    fft2D(real, imag, size);
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            real[y][x] = real[y][x] / size / size;
            imag[y][x] = -imag[y][x] / size / size;
        }
}

export function magsLogShift(
    real: Float64Array[],
    imag: Float64Array[],
    size: number
): Float64Array[] {
    const out: Float64Array[] = Array.from(
        { length: size },
        () => new Float64Array(size)
    );
    let max = 1e-12;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const m = Math.log1p(Math.hypot(real[y][x], imag[y][x]));
            const sx = (x + size / 2) % size;
            const sy = (y + size / 2) % size;
            out[sy][sx] = m;
            if (m > max) max = m;
        }
    }
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) out[y][x] = (out[y][x] / max) * 1.0;
    return out;
}
