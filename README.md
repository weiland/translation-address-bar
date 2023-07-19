# Live text translations in Firefox address bar

Based on https://github.com/nolenroyalty/wardle / https://eieio.games/nonsense/implementing-wordle-in-the-firefox-address-bar/
this is a proof of concept, that you can do translations as well.

## Demonstration video

https://github.com/weiland/translation-address-bar/assets/1645161/33d6d05d-59e4-42b7-8e62-105e64d7a1ab


## Prerequisites

This is a quick demo implemented using Deno, so you should have Deno installed.

0. Clone this repo and cd into it.
1. Obtain an API Key (Auth Key) from [DeepL](https://www.deepl.com/pro-api).
2. Create `.env` file by running `cp .env.example .env`.
3. Enter DeepL Key in `.env` file.

## Run

Start the webserver:

```command
deno task dev
```

By default, the server runs at `http://localhost:3003/`.

Now, you can go to http://localhost:3003/ and in Firefox you can
add this site as a search engine at the bottom where the other search engines
show up.
You can also give this search engine a shortcut (`@translate` or `@t` or something like that).

Then you can use the translations in the address bar.

