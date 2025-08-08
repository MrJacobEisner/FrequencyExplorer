export type Complex2D = {
    real: Float64Array[];
    imag: Float64Array[];
    size: number;
};

function bitReverse(value: number, bits: number): number {
    let reversed = 0;
    for (let i = 0; i < bits; i++) {
        reversed = (reversed << 1) | (value & 1);
        value >>= 1;
    }
    return reversed;
}

export function fft1D(real: Float64Array, imag: Float64Array): void {
    const n = real.length;
    const levels = Math.floor(Math.log2(n));
    if (1 << levels !== n) throw new Error("Length must be power of two");

    // bit-reversal permutation
    for (let i = 0; i < n; i++) {
        const j = bitReverse(i, levels);
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

export function fft2DFromImageData(image: ImageData, size: number): Complex2D {
    // convert to grayscale floats [0,1]
    const real: Float64Array[] = Array.from(
        { length: size },
        () => new Float64Array(size)
    );
    const imag: Float64Array[] = Array.from(
        { length: size },
        () => new Float64Array(size)
    );

    const sx = image.width;
    const sy = image.height;
    // resample by drawing into an offscreen canvas to size x size
    const tmp = document.createElement("canvas");
    tmp.width = size;
    tmp.height = size;
    const tctx = tmp.getContext("2d")!;
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = sx;
    srcCanvas.height = sy;
    srcCanvas.getContext("2d")!.putImageData(image, 0, 0);
    tctx.drawImage(srcCanvas, 0, 0, size, size);
    const data = tctx.getImageData(0, 0, size, size);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const r = data.data[i];
            const g = data.data[i + 1];
            const b = data.data[i + 2];
            const v = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            real[y][x] = v;
            imag[y][x] = 0;
        }
    }

    // row-wise
    for (let y = 0; y < size; y++) fft1D(real[y], imag[y]);
    // col-wise
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

    return { real, imag, size };
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
    // conjugate
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) imag[y][x] = -imag[y][x];
    // forward FFT
    fft2D(real, imag, size);
    // conjugate again and scale
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            real[y][x] = real[y][x] / size / size;
            imag[y][x] = -imag[y][x] / size / size;
        }
}

export function magnitudeLogShifted(
    real: Float64Array[],
    imag: Float64Array[],
    size: number
): Float64Array {
    const mags = new Float64Array(size * size);
    let max = 1e-12;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const m = Math.log1p(Math.hypot(real[y][x], imag[y][x]));
            const sx = (x + size / 2) % size;
            const sy = (y + size / 2) % size;
            mags[sy * size + sx] = m;
            if (m > max) max = m;
        }
    }
    // normalize to [0,255]
    for (let i = 0; i < mags.length; i++) mags[i] = (mags[i] / max) * 255;
    return mags;
}

export function arrayToImageData(arr: Float64Array[], size: number): ImageData {
    const out = new ImageData(size, size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let v = Math.round(arr[y][x] * 255);
            if (v < 0) v = 0;
            if (v > 255) v = 255;
            const i = (y * size + x) * 4;
            out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
            out.data[i + 3] = 255;
        }
    }
    return out;
}

export function magsToImageData(mags: Float64Array, size: number): ImageData {
    const out = new ImageData(size, size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const v = Math.round(mags[y * size + x]);
            const i = (y * size + x) * 4;
            out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
            out.data[i + 3] = 255;
        }
    }
    return out;
}
