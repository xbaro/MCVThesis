require('dotenv').config();
module.exports = {
"development": {
    "dialect": "sqlite",
    "storage": "./db.development.sqlite"
},
"test": {
    "username": "mcv_thesis",
    "password": ".mcv_thesis.",
    "database": "mcv_thesis",
    "host": "127.0.0.1",
    "dialect": "mysql"
},
"production": {
    "username": "mcv_theses",
    "password": ".mcv_theses.",
    "database": "mcv_theses",
    "host": "127.0.0.1",
    "dialect": "postgres"
},
  "docker": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": "postgres"
}
};