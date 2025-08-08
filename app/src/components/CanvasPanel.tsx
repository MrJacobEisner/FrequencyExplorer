type CanvasPanelProps = {
    title: string;
    canvasId: string;
    width?: number;
    height?: number;
};

export function CanvasPanel({
    title,
    canvasId,
    width = 512,
    height = 512,
}: CanvasPanelProps) {
    return (
        <div className="panel">
            <div className="panel-title">{title}</div>
            <div className="panel-body">
                <canvas id={canvasId} width={width} height={height} />
            </div>
        </div>
    );
}

export default CanvasPanel;
