# Movies API



REST API for managing movies and actors using Node.js, TypeScript, and Sequelize.



## Project setup

Clone or download this repository. After that navigate to the folder

```bash
cd ./movie-api
```

You may also pull the image from Docker Hub.

```bash
docker pull arkhiolog/movies-api:latest
```

## Compile and run the project

```bash
docker build -t movies .
docker run -p 8000:8050 --env-file .env movies
```

The postman collection and the file with requests are added to this repo.

Running issues: 

* Run requests with "Content-Type: Application/json" header.
* You can run locally by typing 

```bash
npm run build
npm start
```

But keep in mind that you'll have to change the port number to 8050 in added requests.

## Links

https://hub.docker.com/repository/docker/arkhiolog/movies-api/general