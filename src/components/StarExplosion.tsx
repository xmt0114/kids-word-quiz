import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface StarExplosionProps {
  isVisible: boolean;
  className?: string;
}

const StarExplosion: React.FC<StarExplosionProps> = ({
  isVisible,
  className,
}) => {
  if (!isVisible) return null;

  // 生成5个星星，随机位置和角度
  const stars = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.2,
    size: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
  }));

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute animate-star-explosion"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${star.delay}s`,
            animationDuration: '600ms',
          }}
        >
          <Star
            size={24 * star.size}
            className="text-accent-500 fill-current"
            style={{
              transform: `rotate(${star.rotation}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export { StarExplosion };