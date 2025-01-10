# AaravLabs Backend

This is the backend for AaravLabs. AaravLabs is a fun, educational website for middle schoolers. It combines tough but intresting questions with AI analysis to helps kids know what they got right or where they went wrong.

## Building

To build the backend:
1. Go to `package.json` and replace the `--push` part of the `docker` script `yourusername/aaravlabsapi`
2. Run `npm i` to install required dependencies
3. Run `npm run docker` to build and push to Docker Hub

## Usage

To use this, you need a postgres database.
It is reccomended that you use the `docker-compose.yaml` given in [the main repository](https://github.com/AaravLabsOffical/AaravLabs) for the best experience.