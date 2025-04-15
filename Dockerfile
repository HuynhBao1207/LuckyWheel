# Sử dụng image PHP chính thức với Apache
FROM php:8.2-apache

# Cài đặt các extension cần thiết (như mysqli, pdo_mysql nếu dùng MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copy toàn bộ source code vào thư mục gốc của Apache
COPY . /var/www/html/

# (Tùy chọn) Thiết lập quyền nếu cần
RUN chown -R www-data:www-data /var/www/html

# Mở cổng 80
EXPOSE 80
