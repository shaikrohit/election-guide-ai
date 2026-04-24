FROM nginx:alpine

# Copy all static files into nginx's default serve directory
COPY . /usr/share/nginx/html

# Remove files not needed in production
RUN rm -rf /usr/share/nginx/html/.git \
           /usr/share/nginx/html/scratch \
           /usr/share/nginx/html/tests

# Custom nginx config for SPA / security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run expects port 8080
EXPOSE 8080
