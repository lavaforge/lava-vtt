# lava-vtt

A virtual table-top, that is first and foremost designed to be:

- used for non-virtual or in-person play, to enhance the playing experience of your favourite TTRPG.
- integrated closely with obsidian.md, since that is, what we are using for DMing.

## Running the app

Installing dependencies

```bash
npm install
```

Running the apps

```bash
docker compose up -d mongo

nx serve client
nx serve server
```

Afterward, the app is reachable at `http://localhost:3000`.

## Installing the Raspberry Pi client

```
curl -s https://raw.githubusercontent.com/lavaforge/lava-vtt/main/scripts/setup.sh | sudo bash
```
