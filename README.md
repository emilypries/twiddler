# Tilde

A static, friend-facing build of the Tilde solo tile game.

## Local development

```sh
npm install
npm run dev
```

## Dictionary

The bundled North American English word list is derived from SCOWL 2020.12.07 by Kevin Atkinson. It combines ordinary-word lists through SCOWL level 70, excludes proper names, abbreviations, and contractions, and retains ASCII words of three or more letters. One- and two-letter game words are maintained separately in the application.

SCOWL permits use, modification, and redistribution when its notices are retained. See [SCOWL-COPYRIGHT.txt](SCOWL-COPYRIGHT.txt) for the complete notices. This project does not include or claim to reproduce an official Scrabble dictionary.

## Publishing

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the site with GitHub Pages whenever `main` is updated.
