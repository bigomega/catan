#!/bin/bash
mv ./public ./catan

pkill -f "light-server"
npx -y light-server -q -s . -p 8000\
  -o /views/static-shuffler.html\
  -w "./catan/css/**/*.css, ./catan/js/**/*.js # #" &
NPX_PID=$!

SERVER_PID=""
while [[ -z $SERVER_PID ]]; do
    SERVER_PID=$(pgrep -P $NPX_PID)
    sleep 0.1
done
echo "Server running with PIDs $NPX_PID(npx) --> $SERVER_PID(light-server)"

echo "====================\n Press 'q' to quit.\n===================="
while :; do
    read -n 1 key
    if [[ $key == "q" ]]; then
        echo "You pressed 'q'. Exiting...\n"
        break
    fi
done

kill -9 $SERVER_PID
kill -9 $NPX_PID

mv ./catan ./public
