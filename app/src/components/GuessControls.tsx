export type KernelType = "gaussian" | "motion" | "defocus" | "box";

export type Guess = {
    type: KernelType;
    params: Record<string, number>;
    wiener: "low" | "med" | "high";
};

type GuessControlsProps = {
    value: Guess;
    onChange: (next: Guess) => void;
    onApply: () => void;
    disabled?: boolean;
};

export function GuessControls({
    value,
    onChange,
    onApply,
    disabled,
}: GuessControlsProps) {
    const onType = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const t = e.target.value as KernelType;
        onChange({ ...value, type: t });
    };

    const onParam =
        (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
            const n = Number(e.target.value);
            onChange({ ...value, params: { ...value.params, [key]: n } });
        };

    const onWiener = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const w = e.target.value as Guess["wiener"];
        onChange({ ...value, wiener: w });
    };

    return (
        <div className="controls">
            <div className="row">
                <label>Kernel</label>
                <select value={value.type} onChange={onType}>
                    <option value="gaussian">Gaussian</option>
                    <option value="motion">Motion</option>
                    <option value="defocus">Defocus</option>
                    <option value="box">Box</option>
                </select>
            </div>

            {value.type === "gaussian" && (
                <div className="row">
                    <label>Radius</label>
                    <select
                        value={value.params.radius ?? 3}
                        onChange={onParam("radius")}
                    >
                        {[1, 2, 3, 4, 6, 8].map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {value.type === "motion" && (
                <>
                    <div className="row">
                        <label>Length</label>
                        <select
                            value={value.params.length ?? 9}
                            onChange={onParam("length")}
                        >
                            {[5, 9, 13, 17].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="row">
                        <label>Angle</label>
                        <select
                            value={value.params.angle ?? 0}
                            onChange={onParam("angle")}
                        >
                            {[
                                0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150,
                                165,
                            ].map((deg) => (
                                <option key={deg} value={deg}>
                                    {deg}°
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {value.type === "defocus" && (
                <div className="row">
                    <label>Radius</label>
                    <select
                        value={value.params.radius ?? 3}
                        onChange={onParam("radius")}
                    >
                        {[2, 3, 4, 6, 8].map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {value.type === "box" && (
                <div className="row">
                    <label>Size</label>
                    <select
                        value={value.params.size ?? 3}
                        onChange={onParam("size")}
                    >
                        {[3, 5, 7, 9].map((s) => (
                            <option key={s} value={s}>
                                {s}×{s}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="row">
                <label>Wiener</label>
                <select value={value.wiener} onChange={onWiener}>
                    <option value="low">Low</option>
                    <option value="med">Med</option>
                    <option value="high">High</option>
                </select>
            </div>

            <button onClick={onApply} disabled={disabled}>
                Apply Guess
            </button>
        </div>
    );
}

export default GuessControls;
