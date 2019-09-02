FROM node:latest

WORKDIR /code

RUN npm install -g gulp bower

ADD package.json /code/package.json
ADD bower.json /code/bower.json

RUN npm install

ADD bower_components /code/bower_components
#RUN bower -v --allow-root install

ADD . /code

RUN gulp

EXPOSE 8080
EXPOSE 8443

CMD [ "node", "bin/www" ]

