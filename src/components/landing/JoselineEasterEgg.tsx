"use client";

import { useState, useEffect } from "react";

interface JoselineEasterEggProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function JoselineEasterEgg({ isVisible, onClose }: JoselineEasterEggProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!isVisible) return;

    const moveJoseline = () => {
      setPosition({
        x: Math.random() * 80 + 10 - 96 / 2,
        y: Math.random() * 60 + 10 - 96 / 2,
      });
    };

    const interval = setInterval(moveJoseline, 2000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Semi-transparent background */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={onClose} />

      {/* Joseline the unicorn */}
      <div
        className="relative z-10 pointer-events-auto animate-bounce"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transition: "all 1s ease-in-out",
        }}
        onClick={onClose}
      >
        <div className="text-8xl cursor-pointer hover:scale-110 transition-transform">🦄</div>
        <div className="text-center mt-2 whitespace-nowrap">
          <p className="text-2xl font-serif font-semibold text-[var(--color-accent)]">Joseline</p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Licorne d&apos;Aqua Licorne 🌊✨
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center z-10 pointer-events-auto">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Clique sur Joseline ou le fond pour partir
        </p>
      </div>
    </div>
  );
}
