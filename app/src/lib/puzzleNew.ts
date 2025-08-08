import {
    randomMonotoneBands,
    buildKernelMagnitude2D,
    type Bands,
} from "./kernelBands";
import { fft2D, ifft2D } from "./fftCore";

export type Puzzle = {
    size: number;
    target: Bands; // hidden bands
    blurred: Float64Array[]; // grayscale [0..1]
};

export function textImage(size: number, text = "BLURDL"): Float64Array[] {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, size, size);
    g.fillStyle = "#000";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `${Math.floor(size * 0.22)}px system-ui, sans-serif`;
    g.fillText(text, size / 2, size / 2);
    const data = g.getImageData(0, 0, size, size).data;
    const out: Float64Array[] = Array.from(
        { length: size },
        () => new Float64Array(size)
    );
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            out[y][x] = data[i] / 255; // red channel
        }
    }
    return out;
}

export function applyKernelToImage(
    img: Float64Array[],
    bands: Bands,
    size: number
): Float64Array[] {
    const hMag = buildKernelMagnitude2D(size, bands);
    const r = img.map((row) => Float64Array.from(row));
    const i = Array.from({ length: size }, () => new Float64Array(size));
    fft2D(r, i, size);
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            (r[y][x] *= hMag[y][x]), (i[y][x] *= hMag[y][x]);
    ifft2D(r, i, size);
    return r;
}

export function makePuzzle(size: number): Puzzle {
    const target = randomMonotoneBands();
    const clean = textImage(size);
    const blurred = applyKernelToImage(clean, target, size);
    return { size, target, blurred };
}
