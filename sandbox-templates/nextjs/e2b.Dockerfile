FROM node:20

RUN apt-get update && apt-get install -y curl bash

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

WORKDIR /home/user/nextjs-app

RUN npx --yes create-next-app@15.4.1 . --yes

RUN npx --yes shadcn@2.6.3 init --yes -b neutral --force
RUN npx --yes shadcn@2.6.3 add --all --yes

RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
