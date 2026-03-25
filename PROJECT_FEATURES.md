# Sultan Shrimp Interactive Game Platform

## 🦐 Project Overview

A sophisticated gamified marketing web application designed to increase customer loyalty and engagement for Sultan Shrimp restaurant through daily interactive challenges, leaderboards, and reward systems.

## ✨ Core Features

### 1. **Landing Page & User Registration**
- Elegant registration form collecting:
  - Preferred name
  - Phone number
  - Order source (dine-in or app)
- Real-time IP address detection
- Automatic attempt limit checking (3 per day)
- Countdown timer showing when new attempts become available
- Mobile-first responsive design

### 2. **Interactive Catching Game**
- Canvas-based real-time game mechanics
- Progressive difficulty system (levels 1-10)
- Dynamic shrimp spawning with increasing frequency
- Click-to-catch gameplay
- 60-second game duration
- Visual feedback and animations

### 3. **Golden Shrimp Mechanic**
- 5% spawn chance per shrimp
- Visually distinct (gold color)
- **Double score multiplier** when caught
- **Grants extra attempt** (future feature)
- Rare and valuable collectible

### 4. **Jackpot System**
- Target score: 500+ points
- **Instant 10% discount** on current order
- Real-time jackpot event logging
- Admin notification system
- Encourages high-score competition

### 5. **Real-Time Leaderboard**
- **Top 3 daily scores** displayed prominently
- Live updates after each game
- Medal rankings (🥇🥈🥉)
- Beautiful card-based UI
- Responsive design for all devices

### 6. **Weekly Champions Archive**
- Historical tracking of top scores for each day
- 7-day champion history
- Day-by-day breakdown
- Persistent storage for records

### 7. **Attempt Limiting System**
- **3 attempts per day** per IP/phone combination
- Automatic daily reset at **11:59 PM**
- Countdown timer to next available attempt
- Prevents abuse while encouraging daily engagement

### 8. **Admin Dashboard**
- Real-time jackpot event monitoring
- Winner selection interface
- Notification management
- Statistics overview:
  - Total jackpots today
  - Notifications sent
  - Pending notifications
- Player data access (ready for expansion)

### 9. **Display Mode (In-Store Screens)**
- Full-screen leaderboard for restaurant displays
- Auto-refreshing every 60 seconds
- Large, readable typography
- Real-time clock and date
- Attractive animations and styling
- Perfect for TV/monitor displays

### 10. **Advanced Scoring System**
- Base points: 10 per catch
- Difficulty multiplier (1.5x per level)
- Golden Shrimp bonus (2x multiplier)
- Difficulty increases every 10 seconds
- Spawn rate increases with difficulty

## 🏗️ Technical Architecture

### Database Schema
- **users**: Core authentication 
- **players**: Game participant data
- **gameSessions**: Session tracking and attempt limiting
- **scores**: Individual game results
- **dailyLeaderboard**: Top 3 daily scores
- **weeklyChampions**: Historical champion data
- **jackpotEvents**: Jackpot event logging
- **attemptLimits**: Daily attempt tracking
- **gameplayAnalytics**: Analytics for LLM recommendations

### Backend (tRPC)
- **player.register**: Register new players
- **player.checkAttempts**: Check remaining attempts
- **game.startSession**: Initialize game session
- **game.submitScore**: Submit final score
- **leaderboard.getDaily**: Fetch top 3 scores
- **leaderboard.getWeekly**: Fetch weekly champions
- **admin.getJackpotEvents**: Fetch unnotified jackpots
- **admin.markJackpotNotified**: Mark notification as sent

### Frontend (React + Tailwind)
- **Landing**: Registration and attempt checking
- **Game**: Canvas-based catching game
- **Leaderboard**: Daily and weekly rankings
- **AdminDashboard**: Management interface
- **DisplayMode**: In-store screen display

## 🎮 Game Mechanics

### Difficulty Progression
```
Difficulty = 1 + (Time / 10) * 0.5
Max Difficulty = 10
```

### Spawn Rate
```
Spawn Rate = 1 + (Difficulty - 1) * 0.1 shrimp/second
```

### Score Calculation
```
Base Score = Catches * 10
Difficulty Bonus = Base Score * (Difficulty - 1) * 0.1
Golden Shrimp Bonus = Catches * 10 * 2 (per golden catch)
Final Score = Base Score + Difficulty Bonus + Golden Shrimp Bonus
```

## 🎨 Visual Identity

### Brand Colors
- **Primary Red**: #E74C3C (Shrimp color)
- **Secondary Orange**: #F39C12
- **Accent Green**: #27AE60
- **Gold**: #F1C40F (Golden Shrimp)
- **Dark**: #2C3E50
- **Light**: #ECF0F1

## 📊 Testing

### Test Coverage
- **15 unit tests** passing
- Game logic validation
- Jackpot detection
- Score calculations
- Difficulty progression
- Spawn rate calculations
- Time formatting
- Day-of-week calculations

Run tests:
```bash
pnpm test
```

## 🚀 Deployment

### Environment Variables Required
- `DATABASE_URL`: MySQL/TiDB connection
- `JWT_SECRET`: Session signing secret
- `VITE_APP_ID`: OAuth app ID
- `OAUTH_SERVER_URL`: OAuth backend URL
- `OWNER_OPEN_ID`: Restaurant owner ID
- `OWNER_NAME`: Restaurant owner name

### Build & Deploy
```bash
# Development
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

## 🔐 Security Features

- IP-based attempt limiting
- Phone number validation
- Session-based authentication
- Admin role verification
- HTTPS-only cookies
- CORS protection

## 📱 Mobile Optimization

- Responsive design (mobile-first)
- Touch-friendly buttons
- Optimized canvas rendering
- Fast load times
- Offline-ready structure

## 🎯 Future Enhancements

- [ ] Instagram Story share integration
- [ ] LLM-powered gameplay analytics
- [ ] Push notifications for winners
- [ ] Email notifications
- [ ] Referral system
- [ ] Seasonal leaderboards
- [ ] Achievement badges
- [ ] Multiplayer challenges
- [ ] Social sharing rewards
- [ ] Advanced admin analytics

## 📞 Support & Maintenance

### Key Endpoints
- `/` - Landing page
- `/game/:playerId` - Game interface
- `/leaderboard` - Public leaderboard
- `/admin` - Admin dashboard (requires auth)
- `/display` - In-store display mode

### Database Maintenance
- Daily reset at 11:59 PM (automatic)
- Weekly archive updates
- Attempt limit cleanup
- Analytics aggregation

## 🏆 Success Metrics

- **Daily Active Players**: Target 50+
- **Average Score**: 150+ points
- **Jackpot Hit Rate**: 5-10% of games
- **Repeat Players**: 60%+ daily return rate
- **Engagement Time**: 2-3 minutes per session

---

**Version**: 1.0.0  
**Last Updated**: March 25, 2026  
**Status**: Production Ready ✅
