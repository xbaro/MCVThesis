# MCVThesis

## Install
- Download the code from the repository
- Install Node
- Install bower
npm install bower -g
- Install gulp
    npm install gulp -g
- npm install
- bower install
- gulp

node bin/www

## Production

### Postgres

- Install postgres
    sudo apt-get install postgres
- Create a user and a database
    sudo su - postgres
    createuser -P -d mcv_theses
    exit
    
- Modify the credentials on the file config/config.json
- Run the application in production mode
    NODE_ENV=production node bin/www
    
   


