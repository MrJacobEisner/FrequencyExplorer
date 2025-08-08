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

export function grayscaleFromText(text: string, size: number): Float64Array[] {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.font = `${Math.floor(size * 0.2)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2);
    const data = ctx.getImageData(0, 0, size, size).data;
    const out: Float64Array[] = Array.from(
        { length: size },
        () => new Float64Array(size)
    );
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            out[y][x] = data[i] / 255; // use red channel; text is black
        }
    }
    return out;
}

export function array2DToImageData(
    arr: Float64Array[],
    size: number
): ImageData {
    const out = new ImageData(size, size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let v = Math.round(arr[y][x] * 255);
            if (v < 0) v = 0;
            if (v > 255) v = 255;
            const i = (y * size + x) * 4;
            out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
            out.data[i + 3] = 255;
        }
    }
    return out;
}

export function clamp2D(arr: Float64Array[], size: number) {
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            arr[y][x] = Math.max(0, Math.min(1, arr[y][x]));
}
