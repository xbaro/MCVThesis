FROM node:latest

WORKDIR /code

RUN npm install -g gulp bower

ADD package.json /code/package.json
ADD bower.json /code/bower.json

RUN npm install

RUN bower -v --allow-root install

ADD . /code

RUN gulp

ENV NODE_ENV=docker

EXPOSE 8080
EXPOSE 8443

CMD [ "node", "bin/www" ]

