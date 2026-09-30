####################################
# Image for develop                #
####################################
FROM node:24-trixie-slim as develop

RUN apt-get update && \
    apt-get -y install \
    vim

#RUN npm install -g yarn
RUN npm install -g next

RUN mkdir -p /srv
RUN chown 1000:1000 -R /srv/
WORKDIR /srv/

# Las dependencias, solas y primero. yarn.lock tiene que entrar: sin el, los
# ^ de package.json resuelven a lo mas nuevo del dia y dos builds del mismo
# commit no instalan lo mismo. --frozen-lockfile falla si package.json y el
# lock no cuadran, en vez de resolver en silencio.
COPY package.json yarn.lock /srv/
RUN yarn install --frozen-lockfile

# La config va despues a proposito: cambia seguido, y aqui abajo ya no
# invalida la capa del yarn install. tsconfig.json y los *.config.* no se
# montan en el compose, asi que viven en la imagen y tocarlos pide rebuild
# -- pero uno barato, sin reinstalar las dependencias.
COPY *.json /srv/
COPY *.config.* /srv/


####################################
# Image for Production                #
####################################
FROM linkaform/clave10:develop as prod


USER node