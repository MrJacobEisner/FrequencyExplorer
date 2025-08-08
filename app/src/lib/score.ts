import type { Guess } from "../components/GuessControls";

export type Feedback = Array<"correct" | "close" | "wrong">;

export function feedbackForGuess(answer: Guess, guess: Guess): Feedback {
    const out: Feedback = ["wrong", "wrong", "wrong", "wrong"];
    // kernel type
    out[0] =
        answer.type === guess.type
            ? "correct"
            : isPlausible(answer.type, guess.type)
            ? "close"
            : "wrong";
    // params
    const [p1, p2] = paramKeys(guess.type);
    if (p1)
        out[1] = scoreParam(
            answer.params[p1] as number,
            guess.params[p1] as number
        );
    if (p2)
        out[2] = scoreParam(
            answer.params[p2] as number,
            guess.params[p2] as number,
            p2 === "angle" ? 15 : 1
        );
    // wiener bucket
    out[3] = scoreWiener(answer, guess);
    return out;
}

function isPlausible(a: Guess["type"], b: Guess["type"]) {
    // gaussian vs box marked plausible; others not
    return (
        (a === "gaussian" && b === "box") || (a === "box" && b === "gaussian")
    );
}

function paramKeys(
    type: Guess["type"]
): [keyof Guess["params"] | undefined, keyof Guess["params"] | undefined] {
    if (type === "gaussian" || type === "defocus") return ["radius", undefined];
    if (type === "box") return ["size", undefined];
    if (type === "motion") return ["length", "angle"];
    return [undefined, undefined];
}

function scoreParam(
    ans: number | undefined,
    gus: number | undefined,
    tol = 1
): Feedback[number] {
    if (ans == null || gus == null) return "wrong";
    if (ans === gus) return "correct";
    if (Math.abs(ans - gus) <= tol) return "close";
    return "wrong";
}

function scoreWiener(ans: Guess, gus: Guess): Feedback[number] {
    if (ans.wiener === gus.wiener) return "correct";
    if (ans.wiener === "med" || gus.wiener === "med") return "close";
    return "wrong";
}
