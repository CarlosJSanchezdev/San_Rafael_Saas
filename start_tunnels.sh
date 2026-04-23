#!/bin/bash
# Ngrok tunnel startup script for SRF Web

# Kill existing ngrok processes
pkill -f ngrok 2>/dev/null &
sleep 2

# Start tunnels in background
nohup ngrok http 5173 > /tmp/ngrok_frontend.log 2>&1 &
nohup ngrok http 8000 > /tmp/ngrok_backend.log 2>&1 &

# Wait for tunnels to establish
sleep 10

# Display URLs
echo "=== Ngrok Tunnels ==="
curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('tunnels', []):
    print(t['public_url'])
"
