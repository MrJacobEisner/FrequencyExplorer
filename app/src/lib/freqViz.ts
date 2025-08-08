export function renderMagnitudeToImageData(
    mags: Float64Array[],
    size: number
): ImageData {
    const out = new ImageData(size, size);
    // mags are assumed centered (DC in middle) and already [0..1] or arbitrary; normalize
    let max = 1e-12;
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) max = Math.max(max, mags[y][x]);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const v = Math.max(
                0,
                Math.min(255, Math.round((mags[y][x] / max) * 255))
            );
            const i = (y * size + x) * 4;
            out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
            out.data[i + 3] = 255;
        }
    }
    return out;
}

export function drawImageDataToCanvas(
    ctx: CanvasRenderingContext2D,
    img: ImageData,
    w: number,
    h: number
) {
    const tmp = document.createElement("canvas");
    tmp.width = img.width;
    tmp.height = img.height;
    const t = tmp.getContext("2d")!;
    t.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(tmp, 0, 0, w, h);
}
