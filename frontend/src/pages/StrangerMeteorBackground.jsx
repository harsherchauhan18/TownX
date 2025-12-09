import React, { useEffect, useRef } from 'react';

const StrangerMeteorBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let meteors = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Meteor {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -50;
        this.length = Math.random() * 80 + 60;
        this.speed = Math.random() * 15 + 10;
        this.size = Math.random() * 2 + 1;
        this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
        
        // Stranger Things color palette - deep reds and oranges
        const colors = [
          { r: 220, g: 20, b: 20 },    // Deep red
          { r: 180, g: 0, b: 0 },      // Dark red
          { r: 255, g: 40, b: 0 },     // Red-orange
          { r: 139, g: 0, b: 0 },      // Dark crimson
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.5 + 0.5;
      }

      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if (this.y > canvas.height + 50 || this.x > canvas.width + 50) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        
        // Create gradient for meteor trail
        const gradient = ctx.createLinearGradient(
          this.x,
          this.y,
          this.x - Math.cos(this.angle) * this.length,
          this.y - Math.sin(this.angle) * this.length
        );
        
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`);
        gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x - Math.cos(this.angle) * this.length,
          this.y - Math.sin(this.angle) * this.length
        );
        ctx.stroke();

        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
        
        // Meteor head
        ctx.fillStyle = `rgba(${this.color.r + 35}, ${this.color.g + 35}, ${this.color.b + 35}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Create stars for background
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }

    // Initialize meteors
    for (let i = 0; i < 20; i++) {
      meteors.push(new Meteor());
    }

    let frame = 0;
    const animate = () => {
      // Dark atmospheric background with red tint
      ctx.fillStyle = 'rgba(10, 5, 15, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw twinkling stars
      stars.forEach((star, i) => {
        const twinkle = Math.sin(frame * star.twinkleSpeed + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 200, 200, ${star.opacity * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw meteors
      meteors.forEach(meteor => {
        meteor.update();
        meteor.draw();
      });

      frame++;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: -1 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default StrangerMeteorBackground;