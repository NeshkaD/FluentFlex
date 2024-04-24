# FluentFlex

FluentFlex is an interactive online language learning platform that uses Stephen Krashen's theory of compelling comprehensible input to acquire a language.


## Technical Specifications:
FluentFlex front end uses Angular 11 & Jasmine JavaScript Testing Framework. \
FluentFlex's back end uses ExpressJS, NodeJS, Jasmine JavaScript Testing Framework, & MySQL database.

## Instructions for running:
Please ensure that you have the following downloaded and configured on your machine: \
Node Package Manager (NPM)\
Angular CLI (version 11+) \
MySQL \
NodeJS

Prior to running FluentFlex locally, you will need to have MySQL database server downloaded, configured, set up, and running. See [mysql](https://www.mysql.com/) for instructions for your computer operating system. 

In FluentFlex-backend/config/dbConfig.js, change your password to the password you have for MySQL database.

Before connecting Node.js FluentFlex Application with MySQL, we need the tables first.
So run the SQL script below to create the tables needed for FluentFlex:

```

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
  CONSTRAINT `fk_srt_item_content_item_content_item_id` FOREIGN KEY (`content_item_id`) REFERENCES `content_item` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  CONSTRAINT `fk_srt_detail_srt_item_srt_item_id` FOREIGN KEY (`srt_item_id`) REFERENCES `srt_item` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);


```



To run, please note that the front end and back end run on separate ports and you will need to have MySQL Database server running. First run the back end server (see /FluentFlex-backend README.md for instructions). Next start the front end web application (see /FluentFlex-front README.md for instructions). You will need to run these commands from the root of each respective directories (so you will need to have two separate terminal sessions open).

## Contributers:
Neshka Dantinor
Natalie Valcin

git clone git@github.com:NeshkaD/FluentFlex.git

This project has two sub directories: (1) front-end (2) back-end

Please go to those directories and read the instructions to run those directories


Order of instructions:
1. Run the MySQL database and create the schema
2. Run the back end
3. Run the front end

To run the MySQL database:
Make sure database is running. Check instructions for your particular OS.
In MySQL DB:
File > Open SQL Script > FluentFlex\back-end\sql\generate_db.sql
Execute the SQL script


To run the back-end:
cd FluentFlex\back-end
npm install
node server.js

To run the front end:
cd FluentFlex\front-end
npm install
ng serve
Front end should run on http://localhost:4200/
