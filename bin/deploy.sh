#!/usr/bin/env bash

function stop_container() {
CURRENT=$1

for id in $(sudo docker ps -q)
do
    if echo "$(docker port ${id})" | cut -d ":" -f2 | grep -q "$CURRENT"
    then
        echo "stopping container running at ${CURRENT}"
        sudo docker stop "${id}"
    fi
done
}

# check if ngnix is running
if [ -f /run/nginx.pid ]; then
   echo "Nginx is running"
else
  echo "Starting nginx"
  sudo sytemctl start nginx
  echo "nginx started with PID $(/run/nginx.pid)"
fi

# get the current port
CURRENT_PORT=$(cat /etc/nginx/planetts/current_port)

if [[ -z "$CURRENT_PORT" ]]; then
  echo "No docker running, so setting current port to 4300"
  CURRENT_PORT=4300
fi

if [[ "$CURRENT_PORT" == 4300 ]]; then
   NEW_PORT=5200
else
  NEW_PORT=4300
fi

echo "Current port is $CURRENT_PORT"
echo "New port will be $NEW_PORT"

echo "starting the new container at $NEW_PORT"
cat /etc/nginx/planetts/pass.txt | sudo docker login ghcr.io -u dadepo --password-stdin
sudo docker pull ghcr.io/dadepo/planet-typescript:latest && sudo docker run --rm --name plts$NEW_PORT -d -v /usr/local/planetts/data:/usr/local/planetts/data -p $NEW_PORT:4300 ghcr.io/dadepo/planet-typescript:latest

echo "copying the new nginx configuration in place"
sudo cp "/etc/nginx/planetts/$NEW_PORT.conf" /etc/nginx/nginx.conf

echo "reload the nginx"
sudo systemctl reload nginx

echo "attempt to stop current container at port $CURRENT_PORT"
stop_container $CURRENT_PORT

echo "set the NEW PORT as CURRENT"
sudo echo $NEW_PORT > /etc/nginx/planetts/current_port

echo "clean up docker"
docker system prune -af
