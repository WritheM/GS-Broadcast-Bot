-- phpMyAdmin SQL Dump
-- version 3.5.4
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Dec 19, 2014 at 04:07 PM
-- Server version: 5.5.29-0ubuntu0.12.10.1
-- PHP Version: 5.4.6-1ubuntu1.2

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `grooveshark`
--

-- --------------------------------------------------------

--
-- Table structure for table `songHistory`
--

CREATE TABLE IF NOT EXISTS `songHistory` (
  `broadcastSongID` varchar(30) NOT NULL,
  `userID` int(10) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `songID` int(10) NOT NULL,
  `songName` varchar(60) NOT NULL,
  `artistID` int(10) NOT NULL,
  `artistName` varchar(60) NOT NULL,
  `albumID` int(10) NOT NULL,
  `albumName` varchar(60) NOT NULL,
  `votes` int(10) NOT NULL,
  `upVotes` int(10) NOT NULL,
  `downVotes` int(10) NOT NULL,
  `listens` int(10) NOT NULL,
  `estimateDuration` int(10) NOT NULL,
  PRIMARY KEY (`broadcastSongID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
