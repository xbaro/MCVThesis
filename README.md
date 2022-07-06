# MCVThesis

## Install
- Download the code from the repository
- Install Node
- Install bower
```
    npm install bower -g
```
- Install gulp
```
    npm install gulp -g
```
- Install all the NodeJS dependencies
```
    npm install
```
- Install the javascript libraries
```
    bower install
```
- Run the automated tasks (js compression, stylesheet compilation, ...)
```
    gulp
```
- Run the application in development mode
```
    node bin/www
```
## Production

### Postgres

- Install postgres
```
    sudo apt-get install postgres
```
- Create a user and a database
```
    sudo su - postgres
    createuser -P -d mcv_theses
    psql
    create database mcv_theses owner mcv_theses;
    \q
    exit
``` 
- Modify the credentials on the file config/config.json
- Run the application in production mode
```
    NODE_ENV=production node bin/www
```

### Cluster
- Once tested, run the application in cluster
```
    sudo npm install pm2 -g
    pm2 start pm2_conf.json --env production
``` 
    
## Docker

### First start
In order to apply the migrations in the right way, follow those steps:

1. Start the database: 
```bash
docker-compose up -d db
```
2. Run the migrations: 
```bash 
docker-compose run web node ./node_modules/sequelize-cli/lib/sequelize db:migrate
```
3. Start all services
```bash
docker-compose up -d
```


#### Restore from pre-migrations database
```
docker cp 2019_09_02_mcv_theses_backup.dump XXX:/.
docker-compose exec db pg_restore -U mcv_theses -d mcv_theses --data-only -t users 2019_09_02_mcv_theses_backup.dump
docker-compose exec db pg_restore -U mcv_theses -d mcv_theses --data-only -t periods 2019_09_02_mcv_theses_backup.dump
docker-compose exec db pg_restore -U mcv_theses -d mcv_theses --data-only -t tracks 2019_09_02_mcv_theses_backup.dump
docker-compose exec db pg_restore -U mcv_theses -d mcv_theses --data-only -t thesis 2019_09_02_mcv_theses_backup.dump
docker-compose exec db pg_restore -U mcv_theses -d mcv_theses --data-only -t slots 2019_09_02_mcv_theses_backup.dump
docker-compose exec db pg_restore -U mcv_theses -d mcv_theses --data-only -t configs 2019_09_02_mcv_theses_backup.dump
docker-compose exec db pg_restore -U mcv_theses -d mcv_theses --data-only -t advisors 2019_09_02_mcv_theses_backup.dump
docker-compose exec db pg_restore -U mcv_theses -d mcv_theses --data-only -t committees 2019_09_02_mcv_theses_backup.dump
```

    
   


