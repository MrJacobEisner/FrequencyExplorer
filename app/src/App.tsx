import { useEffect, useState } from "react";
import "./App.css";
import CanvasPanel from "./components/CanvasPanel";
import GuessControls, { type Guess } from "./components/GuessControls";
import AttemptsList, { type AttemptResult } from "./components/AttemptsList";
import { generatePuzzle, makeSyntheticText } from "./lib/puzzle";
import { makeKernel } from "./lib/kernels";
import { wienerDeconvolution } from "./lib/deconvolution";
import { array2DToImageData, drawImageDataToCanvas } from "./lib/image";
import { feedbackForGuess } from "./lib/score";

const MAX_ATTEMPTS = 6;
const SIZE = 256;

function App() {
    const [guess, setGuess] = useState<Guess>({
        type: "gaussian",
        params: { radius: 3 },
        wiener: "med",
    });
    const [attempts, setAttempts] = useState<AttemptResult[]>([]);

    const [puzzle] = useState(() => {
        const clean = makeSyntheticText(SIZE);
        const truth: Guess = {
            type: "motion",
            params: { length: 13, angle: 45 },
            wiener: "med",
        };
        return generatePuzzle(SIZE, truth, clean);
    });

    const [reconImg, setReconImg] = useState<ImageData | null>(null);

    // draw initial blurred and spectrum on mount / puzzle change
    useEffect(() => {
        const blurCtx = (
            document.getElementById("blurCanvas") as HTMLCanvasElement
        )?.getContext("2d");
        const specCtx = (
            document.getElementById("spectrumCanvas") as HTMLCanvasElement
        )?.getContext("2d");
        if (!blurCtx || !specCtx) return;
        const blurImg = array2DToImageData(puzzle.blurred, puzzle.size);
        drawImageDataToCanvas(blurCtx, blurImg, 512, 512);
        drawImageDataToCanvas(specCtx, puzzle.spectrum, 512, 512);
    }, [puzzle]);

    // draw reconstruction when available
    useEffect(() => {
        const ctx = (
            document.getElementById("reconCanvas") as HTMLCanvasElement
        )?.getContext("2d");
        if (!ctx) return;
        if (reconImg) drawImageDataToCanvas(ctx, reconImg, 512, 512);
        else {
            ctx.clearRect(0, 0, 512, 512);
        }
    }, [reconImg]);

    const onApply = () => {
        // compute deconvolution against user's guess
        const kernel = makeKernel(guess, puzzle.size);
        const kFactor =
            guess.wiener === "low"
                ? 0.0005
                : guess.wiener === "med"
                ? 0.005
                : 0.02;
        const recon = wienerDeconvolution(
            puzzle.blurred,
            kernel,
            puzzle.size,
            kFactor
        );
        const img = array2DToImageData(recon, puzzle.size);
        setReconImg(img);
        // score feedback
        const fb = feedbackForGuess(puzzle.truth, guess);
        setAttempts((prev) =>
            [...prev, { guess, feedback: fb }].slice(0, MAX_ATTEMPTS)
        );
    };

    return (
        <div className="shell">
            <header>
                <h1>Blurdl — Frequency Wordle</h1>
            </header>

            <section className="grid">
                <CanvasPanel
                    title="Blurred Image"
                    canvasId="blurCanvas"
                    width={512}
                    height={512}
                />
                <CanvasPanel
                    title="Spectrum"
                    canvasId="spectrumCanvas"
                    width={512}
                    height={512}
                />
                <CanvasPanel
                    title="Reconstruction"
                    canvasId="reconCanvas"
                    width={512}
                    height={512}
                />
            </section>

            <section className="sidebar">
                <GuessControls
                    value={guess}
                    onChange={setGuess}
                    onApply={onApply}
                    disabled={attempts.length >= MAX_ATTEMPTS}
                />
                <AttemptsList attempts={attempts} maxAttempts={MAX_ATTEMPTS} />
            </section>
        </div>
    );
}

export default App;
