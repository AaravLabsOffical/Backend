# AaravLabs Backend

This is the backend for AaravLabs. Aarav Labs is an innovative learning platform designed to help middle schoolers with AI steps and answer analysis. It combines tough but intresting questions with AI analysis to helps kids know what they got right or where they went wrong.

## Building

To build the backend:
1. Go to `package.json` and replace the `--push` part of the `docker` script `yourusername/aaravlabsapi`
2. Run `npm i` to install required dependencies
3. Run `npm run docker` to build and push to Docker Hub

## Usage

To use this, you need a postgres database.
It is reccomended that you use the `docker-compose.yaml` given in [the main repository](https://github.com/AaravLabsOfficial/AaravLabs) for the best experience.

## Developement

Documentation for the API is [here](/index.md)

The `/data` folder contains the jsonl files from [LightEval/MATH on Huggingface](https://huggingface.co/datasets/lighteval/MATH)
