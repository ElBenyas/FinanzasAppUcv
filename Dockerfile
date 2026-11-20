FROM node:22-alpine

WORKDIR /app

# Dependencias (capa cacheable). No hay lockfile en el proyecto, se usa npm install.
COPY package.json ./
# npm 10 (el de node:22) falla con "Cannot read properties of null (reading 'edgesOut')"
# por el bug del resolvedor con estas dependencias/overrides; npm 12 lo resuelve.
RUN npm install -g npm@12.2.2 && npm install --no-audit --no-fund

# Código fuente
COPY . .

EXPOSE 5173

# Servidor de desarrollo accesible desde fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
