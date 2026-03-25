CREATE TABLE `attemptLimits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastAttemptTime` timestamp,
	`resetTime` timestamp,
	`limitDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attemptLimits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyLeaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rank` int NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(255) NOT NULL,
	`score` int NOT NULL,
	`leaderboardDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyLeaderboard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyResetLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resetDate` date NOT NULL,
	`topPlayerId` int,
	`topPlayerName` varchar(255),
	`topScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyResetLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`attemptNumber` int NOT NULL,
	`sessionDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameplayAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analyticsDate` date NOT NULL,
	`totalPlayers` int NOT NULL,
	`totalGames` int NOT NULL,
	`averageScore` decimal(10,2) NOT NULL,
	`highestScore` int NOT NULL,
	`peakHour` int,
	`totalJackpots` int NOT NULL DEFAULT 0,
	`averageDifficulty` decimal(5,2) NOT NULL,
	`llmAnalysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameplayAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jackpotEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(255) NOT NULL,
	`score` int NOT NULL,
	`discountPercentage` decimal(5,2) NOT NULL,
	`notificationSent` boolean NOT NULL DEFAULT false,
	`eventDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jackpotEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`preferredName` varchar(255) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`orderSource` enum('dine-in','app') NOT NULL,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`sessionId` int NOT NULL,
	`score` int NOT NULL,
	`finalScore` int NOT NULL,
	`goldenShrimpCount` int NOT NULL DEFAULT 0,
	`isJackpot` boolean NOT NULL DEFAULT false,
	`jackpotDiscount` decimal(5,2) DEFAULT '0',
	`gameDuration` int NOT NULL,
	`difficulty` int NOT NULL,
	`scoreDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyChampions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayOfWeek` varchar(10) NOT NULL,
	`dayName` varchar(20) NOT NULL,
	`playerId` int NOT NULL,
	`playerName` varchar(255) NOT NULL,
	`score` int NOT NULL,
	`recordDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weeklyChampions_id` PRIMARY KEY(`id`)
);
