import React, { useEffect, useRef } from 'react';
import { Droplets } from 'lucide-react';

interface WaterDropParallaxProps {
  className?: string;
}

export function WaterDropParallax({ className = '' }: WaterDropParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate mouse position relative to center of screen
      const xPos = (clientX - innerWidth / 2);
      const yPos = (clientY - innerHeight / 2);

      // Apply transformations to layers based on depth
      // Depth 1 (closest, moves most, negative direction to follow mouse)
      if (layer1Ref.current) {
        layer1Ref.current.style.transform = `translate(${xPos * -0.06}px, ${yPos * -0.06}px)`;
      }
      
      // Depth 2 (middle)
      if (layer2Ref.current) {
        layer2Ref.current.style.transform = `translate(${xPos * -0.03}px, ${yPos * -0.03}px)`;
      }
      
      // Depth 3 (furthest, moves least)
      if (layer3Ref.current) {
        layer3Ref.current.style.transform = `translate(${xPos * -0.01}px, ${yPos * -0.01}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full min-h-[300px] overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 ${className}`}
    >
      {/* Background Layer 3 (Furthest, small drops, low opacity) */}
      <div ref={layer3Ref} className="absolute inset-0 transition-transform duration-75 ease-out opacity-20">
        <Droplets size={24} className="text-primary absolute top-[15%] left-[20%]" />
        <Droplets size={32} className="text-primary absolute bottom-[20%] right-[15%]" />
        <Droplets size={20} className="text-primary absolute top-[60%] right-[30%]" />
        <Droplets size={28} className="text-primary absolute bottom-[40%] left-[10%]" />
      </div>

      {/* Background Layer 2 (Middle, medium drops) */}
      <div ref={layer2Ref} className="absolute inset-0 transition-transform duration-75 ease-out opacity-40 filter blur-[1px]">
        <Droplets size={48} className="text-primary absolute top-[30%] left-[40%]" />
        <Droplets size={40} className="text-primary absolute bottom-[25%] right-[35%]" />
        <Droplets size={52} className="text-primary absolute top-[10%] right-[10%]" />
      </div>

      {/* Foreground Layer 1 (Closest, largest drops) */}
      <div ref={layer1Ref} className="absolute inset-0 transition-transform duration-75 ease-out opacity-80 filter drop-shadow-md">
        <Droplets size={96} className="text-primary absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-20" />
        <Droplets size={64} className="text-primary absolute top-[20%] right-[25%]" />
        <Droplets size={72} className="text-primary absolute bottom-[15%] left-[25%]" />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none p-8 text-center">
         <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border/50 shadow-sm">
           <h3 className="text-2xl font-bold text-primary mb-2">Smart Water Tracking</h3>
           <p className="text-muted-foreground">Interactive Parallax Effect</p>
         </div>
      </div>
    </div>
  );
}
