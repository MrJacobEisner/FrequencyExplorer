import { fft2D, ifft2D } from "./fft";
import { zeros2D } from "./kernels";

export function convolveFreq(
    image: Float64Array[],
    kernel: Float64Array[],
    size: number
): { real: Float64Array[]; imag: Float64Array[] } {
    // FFT image
    const imR = image.map((r) => Float64Array.from(r));
    const imI = zeros2D(size);
    fft2D(imR, imI, size);
    // FFT kernel
    const kR = kernel.map((r) => Float64Array.from(r));
    const kI = zeros2D(size);
    fft2D(kR, kI, size);
    // multiply in frequency
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            const ar = imR[y][x];
            const ai = imI[y][x];
            const br = kR[y][x];
            const bi = kI[y][x];
            imR[y][x] = ar * br - ai * bi;
            imI[y][x] = ar * bi + ai * br;
        }
    return { real: imR, imag: imI };
}

export function wienerDeconvolution(
    blurred: Float64Array[],
    kernel: Float64Array[],
    size: number,
    kFactor: number
): Float64Array[] {
    const bR = blurred.map((r) => Float64Array.from(r));
    const bI = zeros2D(size);
    fft2D(bR, bI, size);

    const hR = kernel.map((r) => Float64Array.from(r));
    const hI = zeros2D(size);
    fft2D(hR, hI, size);

    // Wiener filter in frequency domain: H* / (|H|^2 + K)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const hr = hR[y][x];
            const hi = hI[y][x];
            const denom = hr * hr + hi * hi + kFactor;
            // multiply B * H* / denom
            const br = bR[y][x];
            const bi = bI[y][x];
            const hConjR = hr;
            const hConjI = -hi;
            const nr = br * hConjR - bi * hConjI;
            const ni = br * hConjI + bi * hConjR;
            bR[y][x] = nr / denom;
            bI[y][x] = ni / denom;
        }
    }

    ifft2D(bR, bI, size);
    return bR;
}
