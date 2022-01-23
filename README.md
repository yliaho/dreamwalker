<h1 align="center">Dreamwalker</h1>
<h3 align="center">Analyser and asset viewer for Alundra PS1 video game</h3>

## What is Dreamwalker

Dreamwalker is an HTML5 app for parsing and analysing raw assets from a Playstation 1 video game Alundra, released in 1997. It uses modern browser APIs for reading the game's main binary file, HTML5 canvas for rendering and Vue 3 for the UI. The aim is to make an user friendly application for browsing, analysing and extracting the game's assets without any technical know-how.

<p align="center">
  <img src="./github/assets/alundra-logo.bmp">
</p>

## Develop

To run the application, clone this repo.

- Run `npm install` to install the dependencies
- Run `npm run dev` to start the vite development server.

This repository does not contain the necessary asset file. You need to provide the binary yourself. Get yourself the Alundra disc image, and find a file called `DATAS.BIN`. Once you have the app running, you can upload the file to the application.
