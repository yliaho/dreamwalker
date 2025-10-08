import { useRef, useEffect } from "react";

interface TilesheetCanvasProps {
  imageData: ImageData;
  scale: number;
}

const TilesheetCanvas = ({ imageData, scale }: TilesheetCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWidth = 256;
  const canvasHeight = 256 * 6;

  useEffect(() => {
    if (!imageData || !canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      draw(ctx, imageData);
    }
  }, [imageData]);

  function draw(ctx: CanvasRenderingContext2D, imageData: ImageData) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.putImageData(imageData, 0, 0);
  }

  return (
    <div className="flex flex-col justify-center">
      <div className="">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          tabIndex={0}
          className="canvas"
          style={{ transform: `scale(${scale + 1})`, transformOrigin: 'left top' }}
        ></canvas>
      </div>
    </div>
  );
};

export default TilesheetCanvas;