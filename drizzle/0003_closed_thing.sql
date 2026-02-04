CREATE TABLE `interactionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`participantId` int NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`eventData` text,
	`targetParticipantId` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`sessionStartTime` timestamp,
	CONSTRAINT `interactionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `replaySessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`sessionHistoryId` int NOT NULL,
	`totalEvents` int NOT NULL DEFAULT 0,
	`sessionDuration` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `replaySessions_id` PRIMARY KEY(`id`)
);
