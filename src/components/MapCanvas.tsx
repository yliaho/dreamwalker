import { useRef, useEffect } from 'react';

interface MapCanvasProps {
  imageDatas?: Array<{ dx: number; dy: number; data: Promise<ImageBitmap> }>;
  canvasWidth?: number;
  canvasHeight?: number;
}

const MapCanvas = ({ imageDatas, canvasWidth, canvasHeight }: MapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!imageDatas || !canvasRef.current || !canvasWidth || !canvasHeight) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      draw(ctx, imageDatas, canvasWidth, canvasHeight);
    }
  }, [imageDatas, canvasWidth, canvasHeight]);

  function draw(
    ctx: CanvasRenderingContext2D,
    imageDatas: Array<{ dx: number; dy: number; data: Promise<ImageBitmap> }>,
    canvasWidth: number,
    canvasHeight: number
  ) {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    imageDatas.forEach(async (imageData) => {
      const resolvedImageBitmap = await imageData.data;
      ctx.drawImage(resolvedImageBitmap, imageData.dx, imageData.dy);
      resolvedImageBitmap.close();
    });
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      tabIndex={0}
      className="canvas"
    ></canvas>
  );
};

export default MapCanvas;