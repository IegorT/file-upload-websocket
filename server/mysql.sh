docker run -p 3306:3306 --name mysqlserver --rm -e MYSQL_ROOT_PASSWORD=qwerty123456 -e MYSQL_DATABASE=test -e MYSQL_ROOT_HOST=% -d mysql/mysql-server