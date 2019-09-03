require('dotenv').config();
module.exports = {
    "development": {
        "dialect": "sqlite",
        "storage": "./db.development.sqlite",
        "smtp": {
            "host": "smtp.gmail.com",
            "port": 587,
            "secure": false,
            "tls": {rejectUnauthorized: false},
            "ignoreTLS ": true,
            "auth": {
                "user": "your_user",
                "pass": "your_password"
            }
        }
    },
    "test": {
        "username": "mcv_thesis",
        "password": ".mcv_thesis.",
        "database": "mcv_thesis",
        "host": "127.0.0.1",
        "dialect": "mysql",
        "smtp": {
            "host": "smtp.gmail.com",
            "port": 587,
            "secure": false,
            "tls": {rejectUnauthorized: false},
            "ignoreTLS ": true,
            "auth": {
                "user": process.env.SMTP_USER,
                "pass": process.env.SMTP_PASSWORD
            }
        }
    },
    "production": {
        "username": "mcv_theses",
        "password": ".mcv_theses.",
        "database": "mcv_theses",
        "host": "127.0.0.1",
        "dialect": "postgres",
        "smtp": {
            "host": "smtp.gmail.com",
            "port": 587,
            "secure": false,
            "tls": {rejectUnauthorized: false},
            "ignoreTLS ": true,
            "auth": {
                "user": process.env.SMTP_USER,
                "pass": process.env.SMTP_PASSWORD
            }
        }
    },
    "docker": {
        "username": process.env.DB_USER,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DB_NAME,
        "host": process.env.DB_HOST,
        "dialect": "postgres",
        "smtp": {
            "host": "smtp.gmail.com",
            "port": 587,
            "secure": false,
            "tls": {rejectUnauthorized: false},
            "ignoreTLS ": true,
            "auth": {
                "user": process.env.SMTP_USER,
                "pass": process.env.SMTP_PASSWORD
            }
        }
    }
};