FROM node:16

ENV NODE_ENV=production
ENV ACTUALDATAPATH=/actualdata
ENV SYNCDATAPATH=/syncdata

RUN mkdir /actualdata
RUN mkdir /syncdata
RUN mkdir /server

WORKDIR /server

COPY ./server/yarn.lock ./
COPY ./server/package.json ./
RUN yarn install

COPY ./server .

EXPOSE 8080

CMD ["node", "./src/index.js"]