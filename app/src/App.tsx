import { useEffect, useMemo, useState } from "react";
import "./App.css";
import CanvasPanel from "./components/CanvasPanel";
import BandSliders from "./components/BandSliders";
import {
    buildKernelMagnitude2D,
    clampBands,
    normalizeDC,
    type Bands,
} from "./lib/kernelBands";
import { drawImageDataToCanvas } from "./lib/freqViz";
import { magsLogShift, fft2D } from "./lib/fftCore";
import { wienerLike } from "./lib/deconv";
import { makePuzzle } from "./lib/puzzleNew";

const SIZE = 256;

export default function App() {
    const [puzzle, setPuzzle] = useState(() => makePuzzle(SIZE));
    const [bands, setBands] = useState<Bands>(() =>
        normalizeDC(clampBands([1, 0.9, 0.8, 0.6, 0.4, 0.3]))
    );
    const [recon, setRecon] = useState<Float64Array[] | null>(null);

    const kernelMag = useMemo(
        () => buildKernelMagnitude2D(SIZE, normalizeDC(clampBands(bands))),
        [bands]
    );

    // Live kernel magnitude
    useEffect(() => {
        const ctx = (
            document.getElementById("kernelCanvas") as HTMLCanvasElement
        )?.getContext("2d");
        if (!ctx) return;
        const img = new ImageData(SIZE, SIZE);
        let max = 1e-12;
        for (let y = 0; y < SIZE; y++)
            for (let x = 0; x < SIZE; x++) max = Math.max(max, kernelMag[y][x]);
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const v = Math.round((kernelMag[y][x] / max) * 255);
                const i = (y * SIZE + x) * 4;
                img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
                img.data[i + 3] = 255;
            }
        }
        drawImageDataToCanvas(ctx, img, 512, 512);
    }, [kernelMag]);

    // Initial draw of blurred and its FFT
    useEffect(() => {
        const blurCtx = (
            document.getElementById("blurCanvas") as HTMLCanvasElement
        )?.getContext("2d");
        const blurSpecCtx = (
            document.getElementById("blurSpecCanvas") as HTMLCanvasElement
        )?.getContext("2d");
        if (!blurCtx || !blurSpecCtx) return;
        const img = new ImageData(SIZE, SIZE);
        for (let y = 0; y < SIZE; y++)
            for (let x = 0; x < SIZE; x++) {
                const v = Math.round(puzzle.blurred[y][x] * 255);
                const i = (y * SIZE + x) * 4;
                img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
                img.data[i + 3] = 255;
            }
        drawImageDataToCanvas(blurCtx, img, 512, 512);
        // spectrum
        const r = puzzle.blurred.map((row) => Float64Array.from(row));
        const i = Array.from({ length: SIZE }, () => new Float64Array(SIZE));
        fft2D(r, i, SIZE);
        const mags = magsLogShift(r, i, SIZE);
        const mImg = new ImageData(SIZE, SIZE);
        let mmax = 1e-12;
        for (let y = 0; y < SIZE; y++)
            for (let x = 0; x < SIZE; x++) mmax = Math.max(mmax, mags[y][x]);
        for (let y = 0; y < SIZE; y++)
            for (let x = 0; x < SIZE; x++) {
                const v = Math.round((mags[y][x] / mmax) * 255);
                const idx = (y * SIZE + x) * 4;
                mImg.data[idx] = mImg.data[idx + 1] = mImg.data[idx + 2] = v;
                mImg.data[idx + 3] = 255;
            }
        drawImageDataToCanvas(blurSpecCtx, mImg, 512, 512);
    }, [puzzle]);

    const onSubmit = () => {
        const reconArr = wienerLike(puzzle.blurred, kernelMag, SIZE, 0.005);
        setRecon(reconArr);
        const rctx = (
            document.getElementById("reconCanvas") as HTMLCanvasElement
        )?.getContext("2d");
        const rsctx = (
            document.getElementById("reconSpecCanvas") as HTMLCanvasElement
        )?.getContext("2d");
        if (!rctx || !rsctx) return;
        const img = new ImageData(SIZE, SIZE);
        for (let y = 0; y < SIZE; y++)
            for (let x = 0; x < SIZE; x++) {
                const v = Math.round(
                    Math.max(0, Math.min(1, reconArr[y][x])) * 255
                );
                const i = (y * SIZE + x) * 4;
                img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
                img.data[i + 3] = 255;
            }
        drawImageDataToCanvas(rctx, img, 512, 512);
        // spectrum of recon
        const R = reconArr.map((row) => Float64Array.from(row));
        const I = Array.from({ length: SIZE }, () => new Float64Array(SIZE));
        fft2D(R, I, SIZE);
        const mags = magsLogShift(R, I, SIZE);
        const mImg = new ImageData(SIZE, SIZE);
        let mmax = 1e-12;
        for (let y = 0; y < SIZE; y++)
            for (let x = 0; x < SIZE; x++) mmax = Math.max(mmax, mags[y][x]);
        for (let y = 0; y < SIZE; y++)
            for (let x = 0; x < SIZE; x++) {
                const v = Math.round((mags[y][x] / mmax) * 255);
                const idx = (y * SIZE + x) * 4;
                mImg.data[idx] = mImg.data[idx + 1] = mImg.data[idx + 2] = v;
                mImg.data[idx] = mImg.data[idx + 1] = mImg.data[idx + 2] = v;
                mImg.data[idx + 3] = 255;
            }
        drawImageDataToCanvas(rsctx, mImg, 512, 512);
    };

    const onReset = () =>
        setBands(normalizeDC(clampBands([1, 0.9, 0.8, 0.6, 0.4, 0.3])));
    const onRandom = () => setPuzzle(makePuzzle(SIZE));

    return (
        <div className="shell">
            <header>
                <h1>Blur Kernel Guess — 6-band</h1>
            </header>
            <section className="grid">
                <CanvasPanel
                    title="Blurred Image"
                    canvasId="blurCanvas"
                    width={512}
                    height={512}
                />
                <CanvasPanel
                    title="Kernel FFT (guess)"
                    canvasId="kernelCanvas"
                    width={512}
                    height={512}
                />
                <CanvasPanel
                    title="Reconstruction"
                    canvasId="reconCanvas"
                    width={512}
                    height={512}
                />
                <CanvasPanel
                    title="Blurred FFT"
                    canvasId="blurSpecCanvas"
                    width={512}
                    height={512}
                />
                <CanvasPanel
                    title="Reconstruction FFT"
                    canvasId="reconSpecCanvas"
                    width={512}
                    height={512}
                />
            </section>
            <section className="sidebar">
                <BandSliders value={bands} onChange={setBands as any} />
                <div className="actions">
                    <button onClick={onSubmit}>Submit</button>
                    <button onClick={onReset}>Reset</button>
                    <button onClick={onRandom}>Randomize</button>
                </div>
            </section>
        </div>
    );
}
