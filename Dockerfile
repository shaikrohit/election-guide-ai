FROM nginx:alpine

# Copy nginx config first
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all static app files
COPY . /usr/share/nginx/html

# Cloud Run expects port 8080
EXPOSE 8080
