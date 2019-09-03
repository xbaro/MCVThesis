FROM node:latest

WORKDIR /code

RUN npm install -g gulp bower

ADD package.json /code/package.json
ADD bower.json /code/bower.json

RUN npm install

# Downgrade pg package to fix bug.
RUN npm install pg@6.4.1

RUN bower -v --allow-root install

ADD . /code

RUN gulp

ENV NODE_ENV=docker

EXPOSE 80
EXPOSE 443

CMD [ "npm", "start" ]

