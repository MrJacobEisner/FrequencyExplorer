import { fft2D, ifft2D } from "./fftCore";

export function wienerLike(
    blurred: Float64Array[],
    kernelMag: Float64Array[],
    size: number,
    epsilon = 0.005
): Float64Array[] {
    const bR = blurred.map((r) => Float64Array.from(r));
    const bI = Array.from({ length: size }, () => new Float64Array(size));
    fft2D(bR, bI, size);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const H = kernelMag[y][x];
            const denom = H * H + epsilon;
            bR[y][x] = (bR[y][x] * H) / denom;
            bI[y][x] = (bI[y][x] * H) / denom;
        }
    }

    ifft2D(bR, bI, size);
    return bR;
}
