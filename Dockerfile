FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy all static app files
COPY . /usr/share/nginx/html

# Cloud Run expects port 8080
EXPOSE 8080

# Use entrypoint to inject env vars, then start nginx
ENTRYPOINT ["/entrypoint.sh"]
