import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import ShareToInstagram from '@/components/ShareToInstagram';
import { BRAND_COLORS, GOLDEN_SHRIMP } from '@shared/gameConstants';
import { isJackpotScore } from '@shared/gameLogic';

interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: 'shrimp' | 'golden' | 'bomb';
  rotation: number;
  rotSpeed: number;
  size: number;
}

export default function Game() {
  const { playerId } = useParams<{ playerId: string }>();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  const [score, setScore] = useState(0);
  const [catches, setCatches] = useState(0);
  const [goldenCatches, setGoldenCatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const gameStateRef = useRef({
    items: [] as FallingItem[],
    score: 0,
    catches: 0,
    goldenCatches: 0,
    timeElapsed: 0,
    nextItemId: 0,
    lastSpawnTime: 0,
    basketX: 200, 
    popups: [] as {x: number, y: number, text: string, life: number, color: string}[],
  });

  const startSessionMutation = trpc.game.startSession.useMutation();
  const submitScoreMutation = trpc.game.submitScore.useMutation();

  useEffect(() => {
    if (!playerId) return;
    const initializeSession = async () => {
      try {
        const storedSession = localStorage.getItem('sessionId') || `user-${Date.now()}`;
        let ip = storedSession;
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            ip = ipData.ip;
          }
        } catch (e) {
          console.log('Using fallback IP');
        }
        const phone = localStorage.getItem('sultan_player_phone') || '0000000000';
        const result = await startSessionMutation.mutateAsync({
          playerId: parseInt(playerId),
          phoneNumber: phone,
          ipAddress: ip,
        });
        setSessionId(result.sessionId);
      } catch (error) {
        console.error('Failed to start session:', error);
        toast.error('فشل بدء الجلسة');
        setLocation('/');
      }
    };
    initializeSession();
  }, [playerId]);

  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mobile-friendly dimensions (Portrait)
    canvas.width = window.innerWidth > 500 ? 400 : window.innerWidth * 0.95;
    canvas.height = Math.min(window.innerHeight * 0.7, 600);
    
    gameStateRef.current.basketX = canvas.width / 2;
    const BASKET_WIDTH = 90;
    const BASKET_HEIGHT = 60;
    const BASKET_Y = canvas.height - BASKET_HEIGHT - 10;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = 0.016; 
      const state = gameStateRef.current;

      state.timeElapsed += deltaTime;
      setTimeElapsed(Math.floor(state.timeElapsed));

      // Spawn mechanic
      const spawnInterval = Math.max(300, 1000 - (state.timeElapsed * 15)); // gets faster
      if (now - state.lastSpawnTime > spawnInterval) {
        const rand = Math.random();
        let type: 'shrimp' | 'golden' | 'bomb' = 'shrimp';
        if (rand < 0.1) type = 'golden';
        else if (rand < 0.3) type = 'bomb';

        state.items.push({
          id: state.nextItemId++,
          x: Math.random() * (canvas.width - 40) + 20,
          y: -50,
          speed: (Math.random() * 2 + 3) + (state.timeElapsed * 0.05), // faster over time
          type,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          size: type === 'golden' ? 45 : (type === 'bomb' ? 35 : 35)
        });
        state.lastSpawnTime = now;
      }

      // Update items & Check Collisions
      state.items = state.items.filter(item => {
        item.y += item.speed;
        item.rotation += item.rotSpeed;

        // Collision with basket
        const inBasketX = item.x > state.basketX - BASKET_WIDTH/2 - 20 && item.x < state.basketX + BASKET_WIDTH/2 + 20;
        const inBasketY = item.y + item.size/2 > BASKET_Y && item.y < BASKET_Y + BASKET_HEIGHT/2;

        if (inBasketX && inBasketY) {
          if (item.type === 'bomb') {
            state.score = Math.max(0, state.score - 20);
            state.popups.push({x: item.x, y: item.y, text: '-20', life: 1, color: '#ef4444'});
          } else {
            state.catches++;
            if (item.type === 'golden') {
              state.goldenCatches++;
              state.score += 50;
              state.popups.push({x: item.x, y: item.y, text: '+50✨', life: 1, color: BRAND_COLORS.GOLD});
            } else {
              state.score += 10;
              state.popups.push({x: item.x, y: item.y, text: '+10', life: 1, color: '#4ade80'});
            }
          }
          setScore(state.score);
          setCatches(state.catches);
          setGoldenCatches(state.goldenCatches);
          return false; // Remove item
        }

        // Remove if off screen
        return item.y < canvas.height + 50;
      });

      // Update popups
      state.popups = state.popups.filter(p => {
        p.y -= 1;
        p.life -= deltaTime;
        return p.life > 0;
      });

      // Draw Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#A0E4F1'); // shallow water
      bgGradient.addColorStop(1, '#1C82AD'); // deep water
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Items
      state.items.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        ctx.font = `${item.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (item.type === 'golden') {
          ctx.shadowColor = BRAND_COLORS.GOLD;
          ctx.shadowBlur = 15;
          ctx.fillText('🦐', 0, 0);
          ctx.shadowBlur = 0;
        } else if (item.type === 'bomb') {
          ctx.fillText('🦀', 0, 0); // Crab represents bad item
        } else {
          ctx.fillText('🦐', 0, 0);
        }
        ctx.restore();
      });

      // Draw Basket (The net)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(state.basketX, BASKET_Y + 10, BASKET_WIDTH/2, 0, Math.PI);
      ctx.fill();
      
      // Basket rim
      ctx.strokeStyle = '#f59e0b'; // amber
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(state.basketX - BASKET_WIDTH/2, BASKET_Y);
      ctx.lineTo(state.basketX + BASKET_WIDTH/2, BASKET_Y);
      ctx.stroke();
      
      // Draw popups
      state.popups.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 24px Arial';
        ctx.globalAlpha = p.life;
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      });

      // Draw UI HUD
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.roundRect(10, 10, 120, 70, 8);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`🏆: ${state.score}`, 20, 35);
      ctx.fillText(`🦐: ${state.catches}`, 20, 60);

      // Timer
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.roundRect(canvas.width - 90, 10, 80, 40, 8);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      const timeLeft = Math.max(0, 60 - Math.floor(state.timeElapsed));
      ctx.fillText(`⏱️ ${timeLeft}s`, canvas.width - 50, 35);

      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  // Touch and Mouse Controls for Basket
  const handleMove = (clientX: number) => {
    if (!canvasRef.current || gameState !== 'playing') return;
    const rect = canvasRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(45, Math.min(canvasRef.current.width - 45, x)); // clamp
    gameStateRef.current.basketX = x;
  };

  useEffect(() => {
    if (timeElapsed >= 60 && gameState === 'playing') {
      endGame();
    }
  }, [timeElapsed, gameState]);

  const endGame = async () => {
    setGameState('ended');
    const finalScore = gameStateRef.current.score;
    const isJackpot = isJackpotScore(finalScore);

    try {
      if (sessionId) {
        await submitScoreMutation.mutateAsync({
          playerId: parseInt(playerId!),
          sessionId,
          score: gameStateRef.current.catches * 10,
          finalScore,
          goldenShrimpCount: gameStateRef.current.goldenCatches,
          isJackpot,
          jackpotDiscount: isJackpot ? '10' : undefined,
          gameDuration: gameStateRef.current.timeElapsed,
          difficulty: 1,
        });

        if (isJackpot) {
          toast.success('🎉 لقد ربحت الجائزة الكبرى! خصم 10%');
        }
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-2"
      style={{ 
        background: `radial-gradient(circle at center, ${BRAND_COLORS.PRIMARY} 0%, ${BRAND_COLORS.DARK} 100%)`,
        overflow: 'hidden', touchAction: 'none'
      }}
    >
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-white mb-4 text-center drop-shadow-md">
          🦐 صائد الجمبري 🦐
        </h1>

        {gameState === 'playing' ? (
          <div className="flex flex-col items-center">
            <div className="relative rounded-xl overflow-hidden shadow-2xl border-[4px] border-white/30 bg-[#1C82AD]">
              <canvas
                ref={canvasRef}
                onMouseMove={(e) => handleMove(e.clientX)}
                onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                className="w-full h-auto cursor-none block"
                style={{ touchAction: 'none' }}
              />
            </div>
            <p className="text-white text-center mt-4 text-sm font-bold bg-black/40 px-4 py-2 rounded-full">
              اسحب يميناً ويساراً لصيد الجمبري! وتجنب السلطعون 🦀
            </p>
          </div>
        ) : (
          <Card className="p-8 text-center shadow-2xl bg-white/95 backdrop-blur-md border-0 rounded-[2rem] animate-in slide-in-from-bottom-10 fade-in duration-700">
            <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              انتهى الوقت! 🎉
            </h2>
            
            <div className="space-y-4 mb-6 bg-gray-50 p-5 rounded-2xl border-2 border-gray-100 shadow-inner">
              <div className="flex items-center justify-between text-xl border-b-2 pb-3 border-gray-200">
                <span className="font-bold text-gray-700">النتيجة:</span>
                <span className="font-black text-3xl" style={{ color: BRAND_COLORS.PRIMARY }}>{score}</span>
              </div>
              
              <div className="flex items-center justify-between text-lg pt-1">
                <span className="font-semibold text-gray-600">أصطدت:</span>
                <span className="font-bold text-xl bg-orange-100 px-3 py-1 rounded-lg">🦐 {catches}</span>
              </div>
              
              {goldenCatches > 0 && (
                <div className="flex items-center justify-between text-lg pt-1 animate-pulse">
                  <span className="font-bold text-amber-500">جمبري ذهبي:</span>
                  <span className="font-bold text-xl bg-amber-50 px-3 py-1 rounded-lg border border-amber-200" style={{ color: BRAND_COLORS.GOLD }}>✨ {goldenCatches}</span>
                </div>
              )}
              
              {isJackpotScore(score) && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 border-2 border-green-400 scale-105 shadow-lg">
                  <p className="text-xl font-black text-green-700 mb-1">🎊 J A C K P O T 🎊</p>
                  <p className="text-green-800 font-bold text-md">مبروك! خصم إضافي 10%!</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <ShareToInstagram
                playerName="Sultan"
                score={score}
                isJackpot={isJackpotScore(score)}
              />
              <Button
                onClick={() => setLocation('/leaderboard')}
                className="w-full py-6 text-lg rounded-xl shadow-lg font-bold"
                style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
              >
                🏆 لوحة المتصدرين
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
