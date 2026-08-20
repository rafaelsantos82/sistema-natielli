# Production frontend: Vite build + nginx (non-root workers)

FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=https://espacoterapia.ps.tec.br/api/v1
ARG VITE_API_PACIENTES=true
ARG VITE_API_PROFISSIONAIS=true
ARG VITE_API_CONSULTAS=true
ARG VITE_API_SALAS=true
ARG VITE_API_UNIDADES=true
ARG VITE_API_FINANCEIRO=true
ARG VITE_API_TERAPIAS=true
ARG VITE_API_ANAMNESES=true
ARG VITE_API_ESTOQUE=true
ARG VITE_API_RH=true
ARG VITE_API_PLANOS=true
ARG VITE_API_MARKETING=true
ARG VITE_API_PRONTUARIO=true
ARG VITE_API_RELATORIOS=true
ARG VITE_API_CONTABILIDADE=true
ARG VITE_API_COMODATO=true
ARG VITE_API_CONTRATOS=true
ARG VITE_API_AUDIT=true
ARG VITE_AUTH_BOOTSTRAP=false

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_PACIENTES=${VITE_API_PACIENTES}
ENV VITE_API_PROFISSIONAIS=${VITE_API_PROFISSIONAIS}
ENV VITE_API_CONSULTAS=${VITE_API_CONSULTAS}
ENV VITE_API_SALAS=${VITE_API_SALAS}
ENV VITE_API_UNIDADES=${VITE_API_UNIDADES}
ENV VITE_API_FINANCEIRO=${VITE_API_FINANCEIRO}
ENV VITE_API_TERAPIAS=${VITE_API_TERAPIAS}
ENV VITE_API_ANAMNESES=${VITE_API_ANAMNESES}
ENV VITE_API_ESTOQUE=${VITE_API_ESTOQUE}
ENV VITE_API_RH=${VITE_API_RH}
ENV VITE_API_PLANOS=${VITE_API_PLANOS}
ENV VITE_API_MARKETING=${VITE_API_MARKETING}
ENV VITE_API_PRONTUARIO=${VITE_API_PRONTUARIO}
ENV VITE_API_RELATORIOS=${VITE_API_RELATORIOS}
ENV VITE_API_CONTABILIDADE=${VITE_API_CONTABILIDADE}
ENV VITE_API_COMODATO=${VITE_API_COMODATO}
ENV VITE_API_CONTRATOS=${VITE_API_CONTRATOS}
ENV VITE_API_AUDIT=${VITE_API_AUDIT}
ENV VITE_AUTH_BOOTSTRAP=${VITE_AUTH_BOOTSTRAP}

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json tailwind.config.ts postcss.config.js components.json ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine

RUN apk --no-cache add wget \
    && sed -i 's|listen       80|listen       8080|g' /etc/nginx/nginx.conf \
    && sed -i 's|^[[:space:]]*pid[[:space:]].*|pid /tmp/nginx.pid;|g' /etc/nginx/nginx.conf \
    && sed -i 's|error_log  /var/log/nginx/error.log notice;|error_log /dev/stderr notice;|g' /etc/nginx/nginx.conf \
    && sed -i 's|access_log  /var/log/nginx/access.log  main;|access_log /dev/stderr main;|g' /etc/nginx/nginx.conf

COPY frontend/nginx-runtime.conf /etc/nginx/conf.d/00-runtime.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html

COPY frontend/docker-entrypoint.sh /usr/local/bin/start-nginx.sh
RUN chmod +x /usr/local/bin/start-nginx.sh

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["/usr/local/bin/start-nginx.sh"]
