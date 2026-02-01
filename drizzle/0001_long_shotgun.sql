CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int,
	`guestName` varchar(50),
	`isReady` boolean NOT NULL DEFAULT false,
	`isHost` boolean NOT NULL DEFAULT false,
	`currentPlatform` varchar(50),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(6) NOT NULL,
	`name` varchar(100) NOT NULL,
	`hostId` int NOT NULL,
	`maxParticipants` int NOT NULL DEFAULT 8,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `rooms_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `swapHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`fromParticipantId` int NOT NULL,
	`toParticipantId` int NOT NULL,
	`swapType` enum('manual','random') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `swapHistory_id` PRIMARY KEY(`id`)
);
