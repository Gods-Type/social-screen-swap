CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`participantId` int NOT NULL,
	`senderName` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`hostName` varchar(50) NOT NULL,
	`participantCount` int NOT NULL,
	`totalSwaps` int NOT NULL DEFAULT 0,
	`totalMessages` int NOT NULL DEFAULT 0,
	`sessionDuration` int NOT NULL,
	`platformsUsed` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp NOT NULL,
	CONSTRAINT `sessionHistory_id` PRIMARY KEY(`id`)
);
