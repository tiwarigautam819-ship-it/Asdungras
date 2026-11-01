import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  bpm?: number;
  barCount?: number;
  height?: number;
  mode?: 'bars' | 'wave' | 'circle';
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  bpm = 128,
  barCount = 36,
  height = 90,
  mode = 'bars'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Maintain peak heights for realistic DJ VU equalizer decay
    const peaks = new Array(barCount).fill(0);
    const heights = new Array(barCount).fill(10);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Speed tied to BPM
      const speed = isPlaying ? (bpm / 60) * 0.08 : 0.02;
      time += speed;

      if (mode === 'bars') {
        const gap = 3;
        const totalGap = gap * (barCount - 1);
        const barWidth = Math.max(3, (w - totalGap) / barCount);

        for (let i = 0; i < barCount; i++) {
          // Calculate dynamic frequency response
          let targetH: number;
          if (isPlaying) {
            // Bass-heavy low ends, rhythmic kick wave
            const kick = Math.pow(Math.abs(Math.sin(time * 2)), 3) * 0.4;
            const wave1 = Math.sin(time * 3 + i * 0.35) * 0.3;
            const wave2 = Math.cos(time * 4.5 + i * 0.5) * 0.2;
            const freqCurve = Math.sin((i / barCount) * Math.PI) * 0.4 + 0.3;
            const raw = (kick + wave1 + wave2 + freqCurve) * (h * 0.85);
            targetH = Math.max(8, Math.min(h * 0.95, raw));
          } else {
            // Idle ambient breathing rhythm
            targetH = 8 + Math.sin(time + i * 0.25) * 6;
          }

          // Smooth interpolation
          heights[i] += (targetH - heights[i]) * 0.35;
          const barH = heights[i];

          // Peak falloff
          if (barH > peaks[i]) {
            peaks[i] = barH;
          } else {
            peaks[i] = Math.max(barH, peaks[i] - 0.7);
          }

          const x = i * (barWidth + gap);
          const y = h - barH;

          // Multi-color neon DJ LED gradient: Lime -> Cyan -> Purple -> Neon Pink / Red on high peak
          const grad = ctx.createLinearGradient(0, h, 0, y);
          grad.addColorStop(0, '#00ff88'); // Green / Bass
          grad.addColorStop(0.4, '#00f0ff'); // Cyan / Mid
          grad.addColorStop(0.75, '#b026ff'); // Purple / Treble
          grad.addColorStop(1, '#ff0055'); // Red / Overdrive

          ctx.fillStyle = grad;
          ctx.shadowColor = isPlaying ? '#00f0ff' : 'transparent';
          ctx.shadowBlur = isPlaying ? 8 : 0;

          // Draw rounded top bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, [2, 2, 0, 0]);
          ctx.fill();

          // Peak hold line
          if (isPlaying) {
            const peakY = h - peaks[i] - 2;
            ctx.fillStyle = '#ff007f';
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 6;
            ctx.fillRect(x, Math.max(0, peakY), barWidth, 2);
          }
        }
      } else if (mode === 'wave') {
        // Continuous moving sound wave
        ctx.beginPath();
        ctx.moveTo(0, h / 2);

        for (let x = 0; x < w; x += 4) {
          const normX = x / w;
          const amp = isPlaying ? h * 0.35 : h * 0.1;
          const y =
            h / 2 +
            Math.sin(normX * 12 + time * 4) * amp * Math.sin(normX * Math.PI) +
            Math.sin(normX * 24 - time * 6) * (amp * 0.4);

          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Secondary counter harmonic wave
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        for (let x = 0; x < w; x += 4) {
          const normX = x / w;
          const amp = isPlaying ? h * 0.25 : h * 0.08;
          const y =
            h / 2 +
            Math.cos(normX * 10 - time * 3) * amp * Math.sin(normX * Math.PI) +
            Math.cos(normX * 18 + time * 5) * (amp * 0.3);

          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, bpm, barCount, height, mode]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={barCount * 8 + 40}
        height={height}
        className="max-w-full drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]"
      />
    </div>
  );
};
