"use strict";

const nodemailer = require('nodemailer');
const path = require('path');
const env = process.env.NODE_ENV || 'development';
const config = require(path.resolve('./config', 'config.js'))[env];

module.exports = nodemailer.createTransport(config.smtp);
