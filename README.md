# Shopizer Administration (shopizer-admin) Angular web app

## Tested with node v12.22.7

Requires Angular cli installed (npm install -g @angular/cli@13.3.x)

# Set backend api



## Run locally

npm install --legacy-peer-deps

ng serve -o

http://localhost:4200

## Build app
ng build 

## Run docker images

Assumes your backend runs on http://localhost:8080/api

```
docker run \
-e "APP_BASE_URL=http://localhost:9090/api" \
-it --rm -p 4200:80 shopizerecomm/shopizer-admin
```

Username: admin@shopizer.com

Password: password

## Next.js (in progress)

A sibling App Router app lives in `next/`. Root CircleCI and the nginx Docker image still build **Angular only**. See `next/README.md`.
