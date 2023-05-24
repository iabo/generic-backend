FROM node:18-alpine AS boardgame_app
LABEL Description="Emailer Backend" Vendor="Trakwell" Version="1.0" Maintainer="Yabdul Abdala <yabdul@doorcounts.com>"

EXPOSE $SERVICE_PORT

RUN apk add --update --no-cache build-base git

WORKDIR /home/node/emailer-backend/
COPY . .
RUN cd .. && mkdir -m 700 .ssh/ && cd emailer-backend/
RUN chown -R node:node /home/node/

USER node

COPY --chown=node:node package*.json ./
# RUN npm install -g nodemon
RUN npm ci


ENV PATH /home/node/emailer-backend/node_modules/.bin/:$PATH

COPY --chown=node:node ./ ./

RUN npm run postinstall

RUN git config --global --add safe.directory /home/node/emailer-backend

CMD ["nodemon"]