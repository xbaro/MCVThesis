# MCVThesis

## Install
- Download the code from the repository
- Install Node
- Install bower
    npm install bower -g
- Install gulp
    npm install gulp -g
- Install all the NodeJS dependencies
    npm install
- Install the javascript libraries
    bower install
- Run the automated tasks (js compression, stylesheet compilation, ...)
    gulp
- Run the application in development mode
    node bin/www

## Production

### Postgres

- Install postgres
    sudo apt-get install postgres
- Create a user and a database
    sudo su - postgres
    createuser -P -d mcv_theses
    psql
    create database mcv_theses owner mcv_theses;
    \q
    exit
    
- Modify the credentials on the file config/config.json
- Run the application in production mode
    NODE_ENV=production node bin/www

### Cluster
- Once tested, run the application in cluster
    sudo npm install pm2 -g
    pm2 start pm2_conf.json --env production
    
   


