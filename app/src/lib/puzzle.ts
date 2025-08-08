import type { Guess } from "../components/GuessControls";
import { convolveFreq } from "./deconvolution";
import { magnitudeLogShifted, magsToImageData, ifft2D } from "./fft";

export type Puzzle = {
    size: number;
    truth: Guess;
    clean: Float64Array[]; // [0,1]
    blurred: Float64Array[]; // [0,1]
    spectrum: ImageData; // magnitude visualization for blurred
};

import { makeKernel } from "./kernels";

export function seedRandom(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
    };
}

export function makeSyntheticText(
    size: number,
    rng = Math.random
): Float64Array[] {
    const words = [
        "HELLO",
        "BLUR",
        "FOURIER",
        "SPECTRUM",
        "KERNEL",
        "PHASE",
        "NOISE",
    ];
    const pick = words[Math.floor(rng() * words.length)];
    // reuse Canvas-based text via image.ts would be ideal; keep here lightweight
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.font = `${Math.floor(size * 0.22)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pick, size / 2, size / 2);
    const data = ctx.getImageData(0, 0, size, size).data;
    const out: Float64Array[] = Array.from(
        { length: size },
        () => new Float64Array(size)
    );
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            out[y][x] = data[i] / 255;
        }
    }
    return out;
}

export function generatePuzzle(
    size: number,
    truth: Guess,
    clean: Float64Array[]
): Puzzle {
    // FFT clean to frequency, multiply by kernel, then IFFT back to blurred
    const kernel = makeKernel(truth, size);
    const { real: BR, imag: BI } = convolveFreq(clean, kernel, size);
    const blurR = BR.map((r) => Float64Array.from(r));
    const blurI = BI.map((r) => Float64Array.from(r));
    ifft2D(blurR, blurI, size);
    // magnitude spectrum from BR/BI
    const specMags = magnitudeLogShifted(BR, BI, size);
    const spectrum = magsToImageData(specMags, size);
    return { size, truth, clean, blurred: blurR, spectrum };
}
