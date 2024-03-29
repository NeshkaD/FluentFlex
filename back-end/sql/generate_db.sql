CREATE DATABASE IF NOT EXISTS fluentflex;
USE fluentflex;


CREATE TABLE `fluentflex`.`user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  UNIQUE KEY `email_UNIQUE` (`email`)
);

CREATE TABLE `fluentflex`.`content_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(45) DEFAULT NULL,
  `language` varchar(45) DEFAULT NULL,
  `media` longblob,
  `media_title` varchar(45) DEFAULT NULL,
  `media_author` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `user_id_idx` (`user_id`),
  CONSTRAINT `` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
);


CREATE TABLE `fluentflex`.`srt_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content_item_id` int NOT NULL,
  `raw_srt` longtext,
  `type` varchar(45) NOT NULL,
  `language` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `_idx` (`content_item_id`),
  CONSTRAINT `fk_srt_item_content_item_content_item_id` FOREIGN KEY (`content_item_id`) REFERENCES `content_item` (`id`)
);

CREATE TABLE `fluentflex`.`srt_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `srt_item_id` int NOT NULL,
  `line_id` int DEFAULT NULL,
  `timestamp_start` int NOT NULL,
  `timestamp_end` int NOT NULL,
  `line` varchar(255) NOT NULL,
  `score` int DEFAULT NULL,
  `attempts` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_srt_detail_srt_item_srt_item_id_idx` (`srt_item_id`),
  CONSTRAINT `fk_srt_detail_srt_item_srt_item_id` FOREIGN KEY (`srt_item_id`) REFERENCES `srt_item` (`id`)
);
