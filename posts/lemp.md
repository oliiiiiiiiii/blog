---
title: 用 LEMP + WordPress 建立自己的部落格
date: 2025-08-05
category: CS
tags: [LEMP, WordPress, Domain Name, SSL, Blog]
summary: 這篇文章詳細介紹如何使用 LEMP 架構在 Ubuntu 上部署 WordPress，從伺服器設定、資料庫配置、SSL 憑證申請，到網域名稱綁定與後台優化，建立一個完整可運作的部落格網站。
---
### 前言
由於台大資訊系的學生很多人都有漂亮的部落格，所以我也想要一個，再加上我上學期修的[網路管理與系統管理](https://www.csie.ntu.edu.tw/~hsinmu/site/courses/25springnasa)課程其中一個 lab 是要用 LEMP + WordPress 建立一個網頁，雖然我做完後覺得 WordPress 的主題都太醜就沒有用了，最後產出的網頁也沒有用到 LEMP 中的 Maria-DB，但我還是把過程記錄下來了。
### Linux
我使用 [AWS](https://aws.amazon.com/tw/) 的 VPS，使用的是 Ubuntu Server 24.04 LTS。
連線進入這台 Ubuntu 後，先確定對外有網路連線，可以使用：
```bash
ping 8.8.8.8
```
### 安裝 Nginx + MariaDB + php
```bash
sudo apt update
```
```bash
sudo apt install nginx mariadb-server php8.3-fpm php-mysql
```
( php-mysql 是 php 的 MySQL 模組，需要這個才能連線、執行 SQL 查詢。)
執行完後去 `http://<你server的公有ip>` 應該要看到下面這個：
![截圖 2025-08-06 04.01.25](https://hackmd.io/_uploads/Hy-V7kg_lg.png)
###  設定 Nginx
```bash
cd /etc/nginx
```
```bash
sudo cp sites-available/default sites-available/wordpress.conf
```
```bash
sudo unlink sites-enabled/default
```
接著用你喜歡的編輯器編輯 `sites-available/wordpress.conf` ( 記得用 `sudo` 權限 )：
```conf
server {
    listen 80 default_server;
    root /var/www/wordpress;

    index index.html index.htm index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }

}
```
```bash
sudo ln -s /etc/nginx/sites-available/wordpress.conf   /etc/nginx/sites-enabled/wordpress.conf
```
```bash
sudo mkdir -p /var/www/wordpress
```
測試 nginx configuration 有沒有錯：
```bash
sudo nginx -t
```
重新載入 nginx：
```bash
sudo systemctl reload nginx
```
建立一個 `/var/www/wordpress/index.php` 測試：
```php
<?php
    phpinfo();
?>
```
去 `http://<你server的公有ip>` 應該要看到下面這個：
![截圖 2025-08-06 04.23.22](https://hackmd.io/_uploads/HJ5Bdyedge.png)
測試完之後記得刪掉，因為留著會有資安問題。
### 設定 MariaDB
```bash
sudo mysql_secure_installation
```
他會跳出很多問題，基本上就是認真讀然後接受他的建議：
```
Enter current password for root (enter for none): [Enter]
Switch to unix_socket authentication: [Enter]
Change the root password? [Y/n] n
Remove anonymous users? [Y/n] Y
Disallow root login remotely? [Y/n] Y
Remove test database and access to it? [Y/n] Y
Reload privilege tables now? [Y/n] Y
```
接著測試可以登入 MySQL：
```bash!
sudo mysql
```
登出：
```sql!
EXIT;
```
### 下載並設定 WordPress
```bash!
cd /tmp
```
```bash!
wget https://wordpress.org/latest.tar.gz
```
```bash!
tar xzvf latest.tar.gz
```
```bash!
cp /tmp/wordpress/wp-config-sample.php /tmp/wordpress/wp-config.php
```
```bash!
sudo cp -a /tmp/wordpress/. /var/www/wordpress
```
```bash!
sudo chown -R www-data:www-data /var/www/wordpress
```
透過 Wordpress API 取得安全的 secret key：
```bash!
wget -O - https://api.wordpress.org/secret-key/1.1/salt/
```
複製下來之後，去把 `/var/www/wordpress/wp-config.php` 裡面的 8 行 secret key 改成剛剛複製下來的。
### 設定 MariaDB 帳號
```bash!
sudo mysql
```
```mysql!
CREATE DATABASE wordpress DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;
```
自己設定 username 跟 password：
```sql!
CREATE USER '<username>'@'localhost' IDENTIFIED BY '<password>';
```
```sql!
GRANT ALL ON wordpress.* TO '<username>'@'localhost';
```
```sql!
EXIT;
```
編輯 `/var/www/wordpress/wp-config.php`，把 username 跟 password 改成剛剛設定的：
```
/** The name of the database for WordPress */
define( 'DB_NAME', 'wordpress' );

/** Database username */
define( 'DB_USER', '<username>' );

/** Database password */
define( 'DB_PASSWORD', '<password>' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );
```
### 讓 WordPress 顯示 404 頁面
把原本那行註解掉改成新的：
```conf!
server {
    . . .
    location / {
        #try_files $uri $uri/ =404;
        try_files $uri $uri/ /index.php$is_args$args;
    }
    . . .
}
```
### WordPress 安裝
去 `http://<你server的公有ip>` 把資訊打一打就可以安裝了！
### Domain Name
應該沒有人希望自己的網頁沒有 Domain Name 吧。
[GitHup 的學生禮包](https://education.github.com/pack)裡面有 Namecheap 跟 Name.com 的免費 Domain Name，Namecheap 只能用在 GitHub Pages，所以我用 Name.com 買了。
買完之後去 Name.com 裡面設定 DNS 的地方設定 A record。Type 填 A、Host 填 @、Answer 填你 server 的公有 ip，TTL 預設就好。
### SSL 憑證
我安裝了 certbot 這個 Let's Encrypt 的自動憑證工具：
```bash!
sudo apt install certbot python3-certbot-nginx -y
```
執行 certbot 幫你設定 HTTPS ( 會問一些問題反正就照實回答 )：
```bash!
sudo certbot --nginx
```
接下來資料庫的內容也要改：
```bash!
sudo mysql
```
```sql!
USE wordpress;
```
```sql!
UPDATE wp_options SET option_value = 'https://<你的domain name>' WHERE option_name = 'siteurl';
```
```sql!
UPDATE wp_options SET option_value = 'https://<你的domain name>' WHERE option_name = 'home';
```
然後用 [wp-cli](https://wp-cli.org/) 把網頁裡面的所有 ip 改成 domain name：
```bash!
sudo wp search-replace 'http://<你server的公有ip>' 'https://<你的domain name>' --allow-root --path=/var/www/wordpress
```
現在應該就能用 `https://<你的domain name>` 看到你的網頁了。
第一次進入會直接到後台，之後再去 `https://<你的domain name>` 就都是你的網頁了，要去後台的話要去 `https://<你的domain name>/wp-admin`。
### PHP 模組
進去網站的後台之後，他說我的網站有這個重大問題：
![截圖 2025-08-12 02.27.57](https://hackmd.io/_uploads/ByYQ_swOll.png)
所以就把那些需要的模組裝一下：
```bash
sudo apt install php8.3-curl php8.3-dom php8.3-imagick php8.3-mbstring php8.3-zip php8.3-gd php8.3-intl -y
```
裝完之後重啟 PHP 跟 Nginx：
```bash
sudo systemctl restart php8.3-fpm
```
```bash
sudo systemctl restart nginx
```