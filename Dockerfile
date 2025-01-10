FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm i

EXPOSE 3000

COPY init.sh /usr/local/bin/init.sh

RUN chmod +x /usr/local/bin/init.sh

ENTRYPOINT ["/usr/local/bin/init.sh"]

CMD ["node", "index.js"]