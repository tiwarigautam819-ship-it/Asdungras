import React, { useEffect, useRef } from 'react';

interface LaserCanvasProps {
  isPlaying?: boolean;
}

export const LaserCanvas: React.FC<LaserCanvasProps> = ({ isPlaying = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Laser beam origins and angles
    const lasers = [
      { originX: 0.1, originY: 0, angle: 0.5, speed: 0.008, color: '#00f0ff', width: 2.5, spread: 0.8 },
      { originX: 0.9, originY: 0, angle: -0.5, speed: -0.007, color: '#ff0055', width: 2.5, spread: 0.8 },
      { originX: 0.5, originY: 0, angle: 0, speed: 0.012, color: '#39ff14', width: 3, spread: 1.1 },
      { originX: 0.3, originY: 0, angle: 0.2, speed: -0.009, color: '#b026ff', width: 2, spread: 0.7 },
      { originX: 0.7, originY: 0, angle: -0.2, speed: 0.011, color: '#00f0ff', width: 2, spread: 0.7 },
      { originX: 0, originY: 0.2, angle: 0.4, speed: 0.006, color: '#ff007f', width: 1.8, spread: 0.6 },
      { originX: 1, originY: 0.2, angle: -0.4, speed: -0.006, color: '#00ffcc', width: 1.8, spread: 0.6 },
    ];

    // Club particles / dust
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.6 - 0.2,
      hue: Math.floor(Math.random() * 360),
      alpha: Math.random() * 0.5 + 0.2,
    }));

    let time = 0;

    const render = () => {
      time += isPlaying ? 0.035 : 0.018;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing ambient club spotlights on top
      const spotColors = [
        { x: width * 0.2, color: 'rgba(0, 240, 255, 0.12)' },
        { x: width * 0.5, color: 'rgba(176, 38, 255, 0.14)' },
        { x: width * 0.8, color: 'rgba(255, 0, 85, 0.12)' },
      ];

      spotColors.forEach((spot, i) => {
        const pulse = 0.8 + 0.3 * Math.sin(time * 3 + i * 2);
        const grad = ctx.createRadialGradient(spot.x, 0, 10, spot.x, height * 0.4, width * 0.45);
        grad.addColorStop(0, spot.color.replace('0.1', `${(0.2 * pulse).toFixed(2)}`));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height * 0.6);
      });

      // 2. Draw sweeping laser beams
      ctx.save();
      lasers.forEach((laser, idx) => {
        const ox = laser.originX * width;
        const oy = laser.originY * height;

        // Current oscillating sweep angle
        const osc = Math.sin(time * (laser.speed * 100) + idx * 1.5) * laser.spread;
        const targetAngle = laser.angle + osc;

        // Target coordinates
        const beamLength = Math.max(width, height) * 1.5;
        const tx = ox + Math.sin(targetAngle) * beamLength;
        const ty = oy + Math.cos(targetAngle) * beamLength;

        // Outer glow
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = laser.width * (isPlaying ? 2.5 : 1.8);
        ctx.shadowColor = laser.color;
        ctx.shadowBlur = isPlaying ? 25 : 16;
        ctx.globalAlpha = isPlaying ? 0.85 : 0.55;
        ctx.stroke();

        // Core bright center
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 4;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
      });
      ctx.restore();

      // 3. Draw floating party dust particles
      ctx.save();
      particles.forEach((p) => {
        p.x += p.speedX * (isPlaying ? 1.5 : 1);
        p.y += p.speedY * (isPlaying ? 1.5 : 1);

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (isPlaying ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 65%, 1)`;
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-75 transition-opacity duration-700"
    />
  );
};
