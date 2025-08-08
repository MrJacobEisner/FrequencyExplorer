import { BAND_CENTERS, type Bands, clampBands } from "../lib/kernelBands";

type Props = {
    value: Bands;
    onChange: (bands: Bands) => void;
    disabled?: boolean;
};

export default function BandSliders({ value, onChange, disabled }: Props) {
    const update = (idx: number, v: number) => {
        const next = value.slice() as Bands;
        next[idx] = v;
        onChange(clampBands(next));
    };
    return (
        <div className="band-sliders">
            {value.map((g, i) => (
                <div key={i} className="band-row">
                    <label>{labelFor(i)}</label>
                    <input
                        type="range"
                        min={0.05}
                        max={1.2}
                        step={0.01}
                        value={g}
                        onChange={(e) => update(i, Number(e.target.value))}
                        disabled={disabled}
                    />
                    <span className="val">{g.toFixed(2)}</span>
                </div>
            ))}
        </div>
    );
}

function labelFor(i: number): string {
    const names = ["DC", "Low", "Low-Mid", "Mid", "High-Mid", "High"];
    return `${names[i]} (${BAND_CENTERS[i]})`;
}
