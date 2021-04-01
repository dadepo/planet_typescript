#!/usr/bin/env bash

function stop_container() {
CURRENT=$1

for id in $(docker ps -q)
do
    if echo "$(docker port ${id})" | cut -d ":" -f2 | grep -q "$CURRENT"
    then
        echo "stopping container running at ${CURRENT}"
        docker stop "${id}"
    fi
done
}

# check if ngnix is running
if [ -f /usr/local/var/run/nginx.pid ]; then
   echo "Nginx is running"
else
  echo "Starting nginx"
  sudo nginx
  echo "nginx started with PID $(/usr/local/var/run/nginx.pid)"
fi

# get the current port
CURRENT_PORT=$(cat /usr/local/etc/planetts/current_port)

if [[ -z "$CURRENT_PORT" ]]; then
  echo "No docker running, so setting current port to 4300"
  CURRENT_PORT=4300
fi

if [[ "$CURRENT_PORT" == 4300 ]]; then
   NEW_PORT=4200
else
  NEW_PORT=4300
fi

echo "Current port is $CURRENT_PORT"
echo "New port will be $NEW_PORT"

echo "starting the new container at $NEW_PORT"
docker run --rm -d -p $NEW_PORT:4300 ghcr.io/dadepo/planet-typescript:latest

echo "copying the new nginx configuration in place"
cp "/usr/local/etc/planetts/$NEW_PORT.conf" /usr/local/etc/nginx/nginx.conf

echo "reload the nginx"
sudo nginx -s reload

echo "attempt to stop current container t port $CURRENT_PORT"
stop_container $CURRENT_PORT

echo "set the NEW PORT as CURRENT"
echo $NEW_PORT > /usr/local/etc/planetts/current_port


