# Spotify-to-MP3

[![NPM version](https://nodei.co/npm/spotify-to-mp3.png)](https://nodei.co/npm/spotify-to-mp3)

[![NPM version](https://badge.fury.io/js/spotify-to-mp3.png)](http://badge.fury.io/js/spotify-to-mp3)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

Export your Spotify tracks, albums and playlists to MP3 with a simple command-line interface.
A **Spotify Premium account is required**. MP3 will be exported in 160kbps. Tested on **Mac OSX only**. 

### Important

I coded this script for fun and experimental purpose with [NodeJs](http://nodejs.org). 
Please use it wisely **for non-spotify compatible devices only.**

## Installation

[NodeJs](http://nodejs.org) required.

    $ npm install -g spotify-to-mp3

Make sure you have [eyeD3](http://eyed3.nicfit.net/) installed 
if you want your MP3 to be properly ID3TAG'ed.

    $ brew install eyeD3

## Usage

    $ spotify-to-mp3 spotify:track:4hOohf45f0JtxYKNsEAIOV -u username -p password

You can add one or more track/album/playlist Spotify URIs or HTTP Link.

| Options | Description |
| ------- | ----------- |
| `-u, --username <username>` | Spotify premium account username. You can also set the username globaly with `export SPOTIFY_USERNAME="{username}"`.
| `-p, --password <password>` | Spotify premium account password. You can also set the password globaly with `export SPOTIFY_PASSWORD="{password}"`.
| `-d, --destination <path>`  | Destination path. Default path is `./`.
| `-f, --format <filename>`   | Format the destination path and filename. Allowed tags are `%artist%`, `%album%`, `%song%`, `%year%`, `%number%` and `%disc%`. Default filename format is `mp3/%artist%/%album% [%year%]/%number% - %song%`.
| `-V, --version`             | Get the current version.
| `-h, --help`                | Display Help.

## Default settings

You can set some default settings. Create a `.spotify-to-mp3.json` file in the working directory or somewhere in the parent directories. 
The user's home directory is a good place.

    {   "username":    "",
        "password":    "",
        "destination": "",
        "format":      ""
    }

## Credits

Thanks to the guys at [node-spotify-web](https://github.com/TooTallNate/node-spotify-web)
for their NodeJS implementation of the Spotify Web protocol.

## License

(The MIT License)

Copyright (c) 2014 Jay Salvat

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICUL