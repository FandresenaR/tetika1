'use client';

import { useEffect, useRef } from 'react';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ControllableChartProps {
  symbol: string;
  data: CandleData[];
  theme?: 'dark' | 'light';
  height?: number;
  annotations?: Array<{
    type: 'line' | 'text';
    value: number | string;
    label: string;
    color: string;
  }>;
}

/**
 * Graphique contrôlable par code (alternative à TradingView)
 * Permet à l'IA d'annoter et d'analyser visuellement
 */
export default function ControllableChart({
  symbol,
  data,
  theme = 'dark',
  height = 400,
  annotations = []
}: ControllableChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const padding = 60;
    const candleWidth = Math.max(5, (canvas.width - padding * 2) / data.length - 2);
    
    // Calcul des min/max
    const prices = data.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Fonction pour convertir prix en coordonnée Y
    const priceToY = (price: number) => {
      return canvas.height - padding - ((price - minPrice) / priceRange) * (canvas.height - padding * 2);
    };

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Couleurs selon le thème
    const bgColor = theme === 'dark' ? '#1f2937' : '#ffffff';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
    const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    const bullColor = '#10b981';
    const bearColor = '#ef4444';

    // Fond
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = padding + (i * (canvas.height - padding * 2) / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      // Labels de prix
      const price = maxPrice - (i * priceRange / 4);
      ctx.fillStyle = textColor;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), padding - 10, y + 4);
    }

    // Dessiner les chandeliers
    data.forEach((candle, index) => {
      const x = padding + index * (candleWidth + 2) + candleWidth / 2;
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);

      const isBullish = candle.close > candle.open;
      ctx.fillStyle = isBullish ? bullColor : bearColor;
      ctx.strokeStyle = isBullish ? bullColor : bearColor;

      // Mèche (wick)
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Corps (body)
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, Math.max(1, bodyHeight));
    });

    // Annotations
    annotations.forEach(annotation => {
      if (annotation.type === 'line') {
        const value = parseFloat(annotation.value as string);
        const y = priceToY(value);

        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = annotation.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(annotation.label, padding + 10, y - 5);
      }
    });

    // Titre
    ctx.fillStyle = textColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(symbol, canvas.width / 2, 30);

  }, [data, theme, annotations, symbol]);

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={height}
        className="w-full h-full"
        style={{ maxWidth: '100%' }}
      />
      <div className="mt-2 text-xs text-gray-500 text-center">
        Graphique contrôlable - {data.length} chandelier{data.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
