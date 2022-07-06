FROM node

WORKDIR /code

RUN npm install -g gulp bower

ADD package.json /code/package.json
ADD bower.json /code/bower.json

# This is required to be able to install SQLite3 package
RUN npm install -g node-gyp
RUN ln -s /usr/bin/python3 /usr/bin/python

RUN npm install

# Downgrade pg package to fix bug.
# RUN npm install pg@6.4.1

RUN bower -v --allow-root install

ADD . /code

RUN gulp

ENV NODE_ENV=docker

EXPOSE 80
#EXPOSE 443

#CMD [ "npm", "start" ]
CMD ["/usr/local/bin/node", "bin/www"]

