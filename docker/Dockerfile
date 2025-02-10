# Usa Node.js para construir la aplicación
FROM node:18-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos necesarios para instalar dependencias
COPY ../package.json ../package-lock.json ./

# Instala las dependencias sin archivos innecesarios
RUN npm install --frozen-lockfile

# Copia el código de la aplicación
COPY ../ ./

# Construye la aplicación de React
RUN npm run build

# Usa Nginx para servir la aplicación
FROM nginx:stable-alpine

# Copia los archivos de React generados en `build/`
COPY --from=builder /app/build /usr/share/nginx/html

# Copia la configuración de Nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

# Inicia Nginx
CMD ["nginx", "-g", "daemon off;"]
