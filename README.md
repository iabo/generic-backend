# Emailer Backend service for Trakwell.ai
Welcome to the Emailer Backend service for Trakwell.ai! This project serves as the backend component for Trakwell.ai's email functionality. It provides a reliable and efficient system for sending emails to users within the Trakwell.ai ecosystem.

### Componentes

To ensure smooth operation, the Emailer Backend service relies on the following components:
- [Node V18.7.0](#node) - The JavaScript runtime environment used for executing server-side code.
- [Koa V9.2.0](#Koa) - A powerful web framework for Node.js, providing a robust foundation for building scalable and efficient web applications.
- [mySQL V8.0.31](#mySQL) - A popular open-source relational database management system, used for storing and managing data related to email operations.

## Quick Start

- Select the correct branch
- Run npm install
- Copy the `example.env` file into a file called `.env`
- run `./bin/generate_keys.sh` to run the ssh keys generation script
- run `docker compose up`
- (Inside the API Docker contaienr) run `npx knex migrate:latest` 
- Server will start listening on port `:7481` 

#### Usage

- Test the API by `GET` `/` on the browser `http://127.0.0.1:7481/`
- Create a user in the DataBase / Use defaulr user
- Login with 
```
curl --location 'http://127.0.0.1:7481/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "yabdala@indevs.site",
    "password": "Password123!"
}'
```
- Login code is sent the user Email
- Verify Login with 
```
curl --location 'http://127.0.0.1:7481/auth/login/verify' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "yabdala@indevs.site",
    "code": "123456"
}'
```
- (code "123456" works on Development enviroment)
- Response will include a JWT
- Use the token to query the database
```
curl --location 'http://127.0.0.1:7481/auth/user' \
--header 'Authorization: bearer eyJ(...etc)'
```

#### Ports

Front End ::

- FRONTEND -> 7482
- SERVICE_PORT -> 7481
- NODEMON_PORT -> 7489

MySQL ::

- MYSQL_PORT -> 7483
- MYSQL_TCP_PORT -> 7484
## Troubleshooting

#### Reset 

- run `docker compose down` twice to stop the container
- run `docker image rm {api?image}` to clear the image 
- Delete node_modules folder 
- run `npm install` again 

#### Installation Issues

Docker ::

- docker: 'compose' is not a docker command. https://github.com/docker/compose/issues/8630

- Command 'docker-compose' not found `sudo apt install docker-compose`

\*https://docs.docker.com/compose/install/

Run MySQL on Port3307 Using Docker Compose





## To Do

*Here's a list of tasks that still need to be completed for this project:*

- [ ] [ yabdul@doorcounts.com ] Add the key generation to docker script
- [ ] [ yabdul@doorcounts.com ] Connect to redis GUI
- [ ] [ yabdul@doorcounts.com ] Setup Domain routing for HTTPS jenkins.domain.com
- [ ] [ yabdul@doorcounts.com ] Implement rate limit on root / api call 
- [ ] [ yabdul@doorcounts.com ] Get OKE config data from backend instead of var
- [ ] [ yabdul@doorcounts.com ] change domain to trakwell


