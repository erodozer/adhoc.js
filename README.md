# adhoc.js

PSP Adhoc server reimplementation compatible with [Prometheus Online](https://www.reddit.com/r/PSP/wiki/pro_online/).

## Why
Just did this for fun as a way to understand what's going on with Adhoc on [PPSSPP](https://www.ppsspp.org/) and Pro Online.  

Particularly I really really wanted to play Pangya with my friends, and I wanted to know why the existing adhoc server wasn't working for me.  Turns out it was because Pro Online actually relies on IP addresses, so it's not too happy when you run multiple clients on the same IP.  When I was first trying to host it, it was on a home server behind a router, so everyone was reporting as on the same IP.  So the best way to host your own persistent adhoc server is to put it on a device/server that has a dedicated static IP, like Digital Ocean.

All that said, this rewrite still provides some value over the original Adhoc server that's floating around.

- simple server implementation based on node.js
- additional Http server with json API, helpful for debugging and building web UIs

## Reference
- https://forums.ppsspp.org/showthread.php?tid=3595&pid=59021#pid59021
- https://github.com/Souler/ppsspp-adhoc-server
