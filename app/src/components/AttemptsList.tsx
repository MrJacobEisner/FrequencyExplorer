import type { Guess } from "./GuessControls";

export type AttemptResult = {
    guess: Guess;
    feedback: Array<"correct" | "close" | "wrong">; // simple Wordle-like feedback
};

type AttemptsListProps = {
    attempts: AttemptResult[];
    maxAttempts: number;
};

export function AttemptsList({ attempts, maxAttempts }: AttemptsListProps) {
    const rows = [...attempts];
    while (rows.length < maxAttempts)
        rows.push(undefined as unknown as AttemptResult);

    return (
        <div className="attempts">
            <div className="attempts-title">Attempts</div>
            <ol>
                {rows.map((row, i) => (
                    <li key={i} className="attempt-row">
                        {row ? (
                            <div className="chips">
                                {/* Kernel type */}
                                <Chip
                                    label={row.guess.type}
                                    state={row.feedback[0]}
                                />
                                {/* Param 1*/}
                                <Chip
                                    label={paramLabel(row.guess, 0)}
                                    state={row.feedback[1]}
                                />
                                {/* Param 2*/}
                                <Chip
                                    label={paramLabel(row.guess, 1)}
                                    state={row.feedback[2]}
                                />
                                {/* Wiener */}
                                <Chip
                                    label={`w:${row.guess.wiener}`}
                                    state={row.feedback[3]}
                                />
                            </div>
                        ) : (
                            <div className="chips placeholder">—</div>
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );
}

function paramLabel(guess: Guess, idx: number): string {
    if (guess.type === "gaussian")
        return idx === 0 ? `r:${guess.params.radius ?? "?"}` : "";
    if (guess.type === "defocus")
        return idx === 0 ? `r:${guess.params.radius ?? "?"}` : "";
    if (guess.type === "box")
        return idx === 0 ? `s:${guess.params.size ?? "?"}` : "";
    if (guess.type === "motion") {
        return idx === 0
            ? `L:${guess.params.length ?? "?"}`
            : `θ:${guess.params.angle ?? "?"}`;
    }
    return "";
}

function Chip({
    label,
    state,
}: {
    label: string;
    state: "correct" | "close" | "wrong";
}) {
    return <span className={`chip ${state}`}>{label}</span>;
}

export default AttemptsList;
