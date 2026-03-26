import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import ShareToInstagram from '@/components/ShareToInstagram';
import { BRAND_COLORS, GOLDEN_SHRIMP } from '@shared/gameConstants';
import { isJackpotScore } from '@shared/gameLogic';
import { demoMode } from '@/lib/demoMode';

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

interface Bubble {
  x: number;
  y: number;
  speed: number;
  radius: number;
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
  const [isInitializing, setIsInitializing] = useState(true);

  const gameStateRef = useRef({
    items: [] as FallingItem[],
    bubbles: [] as Bubble[],
    score: 0,
    catches: 0,
    goldenCatches: 0,
    combo: 0, 
    timeElapsed: 0,
    nextItemId: 0,
    lastSpawnTime: 0,
    basketX: 200, 
    popups: [] as {x: number, y: number, text: string, life: number, color: string}[],
    shakeTime: 0,
  });

  // Demo Mode: No API mutations needed

  const playSound = useCallback((type: 'shrimp' | 'golden' | 'bomb') => {
    try {
      // التهيئة اللحظية (Lazy Initialization)
      if (!(window as any).globalAudioCtx) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        (window as any).globalAudioCtx = new AudioContext();
      }
      
      const actx = (window as any).globalAudioCtx;
      
      // محاولة استئناف الصوت إذا كان المتصفح قد أوقفه
      if (actx.state === 'suspended') {
        actx.resume().catch(() => {});
      }

      const osc = actx.createOscillator();
      const gainNode = actx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(actx.destination);
      
      const now = actx.currentTime;

      if (type === 'shrimp') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'golden') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(2000, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      // تجاهل أخطاء تشغيل الصوت بصمت
    }
  }, []);

  const initializeSession = useCallback(async () => {
    if (!playerId) return;
    setIsInitializing(true);
    try {
      // Demo Mode: Skip API call, use playerId as session ID
      setSessionId(parseInt(playerId));
    } catch (error) {
      console.error('Session init error:', error);
      toast.error('فشل بدء اللعبة');
      setLocation('/');
    } finally {
      setIsInitializing(false);
    }
  }, [playerId, setLocation]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const resetGame = () => {
    setGameState('playing');
    setScore(0);
    setCatches(0);
    setGoldenCatches(0);
    setTimeElapsed(0);
    gameStateRef.current = {
      items: [],
      bubbles: [],
      score: 0,
      catches: 0,
      goldenCatches: 0,
      combo: 0,
      timeElapsed: 0,
      nextItemId: 0,
      lastSpawnTime: 0,
      basketX: window.innerWidth > 500 ? 200 : window.innerWidth / 2, 
      popups: [],
      shakeTime: 0,
    };
    initializeSession(); // Starts a new session securely checking attempts limits
  };

  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current || isInitializing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth > 500 ? 400 : window.innerWidth * 0.95;
    canvas.height = Math.min(window.innerHeight * 0.75, 650);
    
    gameStateRef.current.basketX = canvas.width / 2;
    const BASKET_WIDTH = 90;
    const BASKET_HEIGHT = 60;
    const BASKET_Y = canvas.height - BASKET_HEIGHT - 20;

    let lastTime = performance.now();
    let startTime = performance.now();
    let isRunning = true; 
    let animationId: number;

    for(let i=0; i<15; i++) {
       gameStateRef.current.bubbles.push({
         x: Math.random() * canvas.width,
         y: Math.random() * canvas.height,
         speed: Math.random() * 1.5 + 0.5,
         radius: Math.random() * 4 + 2
       });
    }

    const gameLoop = () => {
      if (!isRunning) return;

      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      
      const state = gameStateRef.current;
      state.timeElapsed = (now - startTime) / 1000;
      setTimeElapsed(state.timeElapsed);

      const timeScale = deltaTime * 60; // relative to 60fps

      // ==========================================
      // --- نظام الصعوبة التدريجية (Dynamic Difficulty) ---
      // ==========================================
      // نزيد الصعوبة لتصل إلى الحد الأقصى مبكراً (عند الثانية 40 بدل 60) لتستمر الصعوبة الرهيبة للمدة الباقية
      const progressRatio = Math.min(1.0, state.timeElapsed / 40); 

      // 1. سرعة سقوط العناصر (تصل إلى 9 بدل 8.5)
      const baseSpeed = 2.5 + (progressRatio * 6.5); 
      
      // 2. معدل ظهور العناصر (مطر قاسي يصل لـ 150 ملي ثانية)
      const spawnInterval = Math.max(150, 1200 - (progressRatio * 1050)); 

      // 3. احتمالية ظهور السلطعون (تصل إلى 60% كابوريا في النهاية!)
      const bombChance = 0.20 + (progressRatio * 0.40);

      // 4. احتمالية ظهور الجمبري الذهبي (نادر بنسبة 1% فقط)
      const goldenChance = Math.max(0.01, 0.10 - (progressRatio * 0.09));

      if (now - state.lastSpawnTime > spawnInterval) {
        const rand = Math.random();
        let type: 'shrimp' | 'golden' | 'bomb' = 'shrimp';
        if (rand < goldenChance) type = 'golden';
        else if (rand < goldenChance + bombChance) type = 'bomb'; // تأخذ مساحتها بعد الذهبي

        state.items.push({
          id: state.nextItemId++,
          x: Math.random() * (canvas.width - 40) + 20,
          y: -50,
          // سرعة العنصر الفردي تعتمد على السرعة الأساسية مع قليل من العشوائية (+ أو - 1)
          speed: (Math.random() * 1.5 + baseSpeed), 
          type,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
          size: type === 'golden' ? 45 : (type === 'bomb' ? 40 : 38)
        });
        state.lastSpawnTime = now;
      }

      state.bubbles.forEach(b => {
        b.y -= b.speed * timeScale;
        if (b.y < -10) {
           b.y = canvas.height + 10;
           b.x = Math.random() * canvas.width;
        }
      });

      let shakeX = 0;
      let shakeY = 0;
      if (state.shakeTime > 0) {
         state.shakeTime -= deltaTime;
         shakeX = (Math.random() - 0.5) * 15;
         shakeY = (Math.random() - 0.5) * 15;
      }

      state.items = state.items.filter(item => {
        item.y += item.speed * timeScale;
        item.rotation += item.rotSpeed * timeScale;

        const inBasketX = item.x > state.basketX - BASKET_WIDTH/2 - 15 && item.x < state.basketX + BASKET_WIDTH/2 + 15;
        const inBasketY = item.y + item.size/2 > BASKET_Y && item.y < BASKET_Y + BASKET_HEIGHT/2;

        if (inBasketX && inBasketY) {
          playSound(item.type); // تشغيل الصوت عند الاصطياد
          if (item.type === 'bomb') {
            state.combo = 0;
            state.score = Math.max(0, state.score - 20);
            state.shakeTime = 0.3; 
            state.popups.push({x: item.x, y: item.y, text: '-20', life: 1.2, color: '#ef4444'});
          } else {
            state.catches++;
            state.combo++;
            let comboBonus = Math.floor(state.combo / 5) * 5; 
            
            if (item.type === 'golden') {
              state.goldenCatches++;
              let points = 50 + comboBonus;
              state.score += points;
              state.popups.push({x: item.x, y: item.y, text: `+${points}✨`, life: 1.2, color: '#FFD700'});
            } else {
               let points = 10 + comboBonus;
              state.score += points;
              state.popups.push({x: item.x, y: item.y, text: `+${points}`, life: 1, color: '#4ade80'});
            }
          }
          setScore(state.score);
          setCatches(state.catches);
          setGoldenCatches(state.goldenCatches);
          return false;
        }

        if (item.y > canvas.height + 50) {
           if (item.type !== 'bomb') {
             state.combo = 0;
           }
           return false;
        }
        return true;
      });

      state.popups = state.popups.filter(p => {
        p.y -= 1.5 * timeScale;
        p.life -= deltaTime;
        return p.life > 0;
      });

      ctx.save();
      ctx.translate(shakeX, shakeY);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#7DD3FC'); 
      bgGradient.addColorStop(1, '#0284C7'); 
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      state.bubbles.forEach(b => {
         ctx.beginPath();
         ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
         ctx.fill();
      });

      // إرجاع الألوان لدرجة الوضوح 100% حتى لا تتأثر بالشفافية الخاصة بالفقاعات
      ctx.fillStyle = '#FFFFFF';

      state.items.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        
        ctx.font = `${item.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // إعادة التوهج الأصلي البسيط لكل إيموجي
        if (item.type === 'golden') {
          ctx.shadowColor = '#FFD700'; 
          ctx.shadowBlur = 20;
          ctx.fillText('🦐', 0, 0);
          ctx.shadowBlur = 0;
        } else if (item.type === 'bomb') {
          // يمكننا إعطاء الكابوريا ظل خفيف أحمر بدلاً من دائرة بشعة
          ctx.shadowColor = '#DC2626'; 
          ctx.shadowBlur = 5;
          ctx.fillText('🦀', 0, 0); 
          ctx.shadowBlur = 0;
        } else {
          // الجمبري العادي بدون أي ظلال إضافية
          ctx.fillText('🦐', 0, 0);
        }
        ctx.restore();
      });

      ctx.font = `${BASKET_WIDTH}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('🧺', state.basketX, BASKET_Y - 10);

      state.popups.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.font = '900 24px "Segoe UI"';
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      });

      ctx.restore();

      // إرجاع الإعدادات للوضع الافتراضي لضمان عدم تأثر الشاشة بأي شفافية أو ظلال سابقة
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      const scoreX = 10;
      const scoreY = 10;
      const scoreW = 150;
      const scoreH = 65;

      // تصميم كارتوني (شبه ألعاب الموبايل الجاهزة)
      ctx.fillStyle = '#1E293B'; // كحلي غامق صلب (Solid) ليكون واضح جداً ولا يختلط بالخلفية
      ctx.strokeStyle = '#38BDF8'; // إطار أزرق فاتح مبهج
      ctx.lineWidth = 4; // إطار سميك قليلاً لطابع كارتوني
      
      ctx.beginPath();
      ctx.roundRect(scoreX, scoreY, scoreW, scoreH, 16);
      ctx.fill();
      ctx.stroke();

      // نصوص النتيجة
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 18px "Segoe UI", Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`🏆 النتيجة: ${state.score}`, scoreX + 15, scoreY + 12);
      
      ctx.font = 'bold 15px "Segoe UI", Arial';
      ctx.fillStyle = state.combo > 2 ? '#FDE047' : '#94A3B8'; // الأصفر للكومبو، رمادي فاتح للعادي
      ctx.fillText(`🔥 كومبو: x${state.combo}`, scoreX + 15, scoreY + 38);

      // مؤقت الوقت
      const timeLeft = Math.max(0, 60 - Math.floor(state.timeElapsed));
      const timeW = 90;
      const timeH = 45;
      const timeX = canvas.width - timeW - 10;
      const timeY = 10;
      
      const isTimeLow = timeLeft <= 10;
      ctx.fillStyle = isTimeLow ? '#EF4444' : '#1E293B';
      ctx.strokeStyle = isTimeLow ? '#FECACA' : '#38BDF8';
      ctx.lineWidth = 4;
      
      ctx.beginPath();
      ctx.roundRect(timeX, timeY, timeW, timeH, 16);
      ctx.fill();
      ctx.stroke();
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 22px "Segoe UI", Arial';
      ctx.fillText(`⏱️ ${timeLeft}`, timeX + (timeW/2), timeY + (timeH/2));

      if (state.timeElapsed >= 60) {
         isRunning = false;
         setGameState('ended');
         return;
      }

      if (isRunning) {
         animationId = requestAnimationFrame(gameLoop);
      }
    };

    animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      isRunning = false;
      cancelAnimationFrame(animationId);
    };
  }, [gameState, isInitializing]);

  const handleMove = (clientX: number) => {
    if (!canvasRef.current || gameState !== 'playing') return;
    const rect = canvasRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(45, Math.min(canvasRef.current.width - 45, x)); 
    gameStateRef.current.basketX = x;
  };

  useEffect(() => {
    if (gameState === 'ended' && timeElapsed >= 60) {
      endGame();
    }
  }, [gameState]);

  const endGame = async () => {
    const finalScore = gameStateRef.current.score;
    const isJackpot = isJackpotScore(finalScore);

    try {
      // Demo Mode: Save score to localStorage
      const session = demoMode.getSession();
      if (session) {
        demoMode.saveScore({
          playerName: session.playerName,
          score: finalScore,
          catches: gameStateRef.current.catches,
          goldenCatches: gameStateRef.current.goldenCatches,
          timeElapsed: Math.min(60, gameStateRef.current.timeElapsed),
        });
      }

      if (isJackpot) {
        toast.success('🎉 لقد ربحت الجائزة الكبرى! خصم 10%');
      }
    } catch (error) {
      console.error('Failed to save score:', error);
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
        {isInitializing ? (
           <h1 className="text-3xl font-extrabold text-white mb-4 text-center animate-pulse">
            جاري التحميل...
           </h1>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-white mb-4 text-center drop-shadow-md">
              🦐 صائد الجمبري 🦐
            </h1>

            {gameState === 'playing' ? (
              <div className="flex flex-col items-center">
                <div className="relative rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.4)] border-[4px] border-white/40 bg-[#0284C7]">
                  <canvas
                    ref={canvasRef}
                    onMouseMove={(e) => handleMove(e.clientX)}
                    onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                    className="w-full h-auto cursor-none block"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <div className="w-full flex justify-between px-4 mt-4 text-center">
                   <p className="text-white font-bold bg-black/30 px-3 py-1.5 rounded-xl shadow-inner border border-white/10 text-sm">
                     سلطعون: -20 نقطة 🦀
                   </p>
                   <p className="text-yellow-300 font-bold bg-black/30 px-3 py-1.5 rounded-xl shadow-inner border border-white/10 text-sm">
                     جمبري ذهبي: +50 ✨
                   </p>
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center shadow-2xl bg-white/95 backdrop-blur-md border-0 rounded-[2rem] animate-in slide-in-from-bottom-10 fade-in duration-700">
                <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                  انتهى الوقت! 🎉
                </h2>
                
                <div className="space-y-4 mb-6 bg-gray-50 p-5 rounded-2xl border-2 border-gray-100 shadow-inner">
                  <div className="flex items-center justify-between text-xl border-b-2 pb-3 border-gray-200">
                    <span className="font-bold text-gray-700">النتيجة النهائية:</span>
                    <span className="font-black text-4xl" style={{ color: BRAND_COLORS.PRIMARY }}>{score}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-lg pt-1">
                    <span className="font-semibold text-gray-600">أصطدت:</span>
                    <span className="font-bold text-xl bg-orange-100 px-3 py-1 rounded-lg">🦐 {catches}</span>
                  </div>
                  
                  {goldenCatches > 0 && (
                    <div className="flex items-center justify-between text-lg pt-1 animate-pulse">
                      <span className="font-bold text-amber-500">جمبري ذهبي:</span>
                      <span className="font-bold text-xl bg-amber-50 px-3 py-1 rounded-lg border border-amber-200" style={{ color: '#d97706' }}>✨ {goldenCatches}</span>
                    </div>
                  )}
                  
                  {isJackpotScore(score) && (
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 border-2 border-green-400 scale-105 shadow-lg">
                      <p className="text-xl font-black text-green-700 mb-1">🎊 J A C K P O T 🎊</p>
                      <p className="text-green-800 font-bold text-lg">مبروك! خصم إضافي 10%!</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <ShareToInstagram
                    playerName="Sultan"
                    score={score}
                    isJackpot={isJackpotScore(score)}
                  />
                  
                  {/* Play Again Button */}
                  <Button
                    onClick={resetGame}
                    className="w-full py-6 text-xl rounded-xl shadow-lg font-bold hover:scale-105 transition-transform bg-green-500 hover:bg-green-600 text-white"
                  >
                    🔄 إلعب مرة أخرى
                  </Button>

                  <Button
                    onClick={() => setLocation('/leaderboard')}
                    className="w-full py-6 text-xl rounded-xl shadow-lg font-bold hover:scale-105 transition-transform"
                    style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                  >
                    🏆 لوحة المتصدرين
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
