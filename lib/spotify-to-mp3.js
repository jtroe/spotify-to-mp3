var spotifyWeb = require('spotify-web'),
    commander  = require('commander'),
    path       = require('path'),
    https      = require('https'),
    cp         = require('child_process'),
    fs         = require('fs'),
    q          = require('q'),
    pkg        = require('../package.json');

var separator = Array(80).join("-");

function spotifyToMp3() {

    /**
     * Try to load global settings from .spotify-to-mp3.json
     */
     var globalSettings = {},
         pathSplits     = process.cwd().split('/'),
         splitCount     = pathSplits.length;

    for (var i = 0; i < splitCount; i++) {
        var cwd = pathSplits.join('/') + '/.spotify-to-mp3.json';

        if (fs.existsSync(cwd)) {
            console.log(separator);
            console.log('Loading settings from %s...', cwd);

            globalSettings = require(cwd) || {};
            break;
        }

        pathSplits.pop();
    }

    /**
     * Default settings
     * @type {Object}
     */
    var defaults = {
        'username':    globalSettings.username    || process.env.SPOTIFY_USERNAME || '',
        'password':    globalSettings.password    || process.env.SPOTIFY_PASSWORD || '',
        'destination': globalSettings.destination || process.cwd(),
        'format':      globalSettings.format      || 'mp3/%artist%/%album% [%year%]/%number% - %song%'
    };

    /**
     * Commander settings 
     */
    commander
        .usage('[options] <uri ...>')
        .option('-u, --username <username>',  'set Spotify username [ ' + defaults.username + ' ]', defaults.username)
        .option('-p, --password <password>',  'set Spotify password', defaults.password)
        .option('-d, --destination <path>',   'set destination path [ ' + defaults.destination + ' ]', defaults.destination)
        .option('-f, --format <path format>', 'format output path [ ' + defaults.format + ' ]', defaults.format)
        .version(pkg.version)
        .parse(process.argv);

    /**
     * Settings
     */
    var settings = {
        'username':    commander.username,
        'password':    commander.password,
        'destination': commander.destination,
        'format':      commander.format,
    };

    /**
     * Argumentas
     */
    var args = commander.args;

    if (args.length === 0) {
        console.error(pkg.name + ': Spotify URI required');

        process.exit();
    }

    /**
     * Connect to Spotify
     */
    console.log(separator);
    console.log('Connecting to Spotify...');

    spotifyWeb.login(settings.username, settings.password, function (err, spotify) {
        if (err) {
            throw new Error(err);
        }

        console.log(separator);
        console.log('Fetching track information...');

        /**
         * Extract track URIs only
         */
        var uris = [],
            x    = 0;

        next();

        function next() {
            // If all the track URIs are extracted
            // then download
            if (x >= args.length) {
                return downloadTracks(uris);
            }

            // Clean the URI string
            var uri = args[x++]
                .replace('http://open.spotify.com/', 'spotify:')
                .replace(/\//g, ':');
            
            // Type of URI (track, playlist, album, etc...)
            var type = spotifyWeb.uriType(uri);

            // Track URI
            if (type === 'track') {
                uris.push(uri);

                next();

            // Playlist, so extract Tracks
            } else if (type === 'playlist') {
                spotify.playlist(uri, 0, 9999, function (err, playlist) {
                    if (err) {
                        throw err;
                    }
                    
                    if (playlist.length > 0) {
                        playlist.contents.items.forEach(function (track) {
                            uris.push(track.uri);
                        });
                    }
                    
                    next();
                });

            // Album, so extract Tracks
            } else if (type === 'album') {
                spotify.get(uri, function (err, album) {
                    if (err) {
                        throw err;
                    }

                    album.disc.forEach(function (disc) {
                        if (!Array.isArray(disc.track)) {
                            return;
                        }
                        
                        disc.track.forEach(function(track) {
                            uris.push(track.uri);
                        });
                    });
                    
                    next();
                });

            // Other ignored types
            } else {
                next();
            }
        }

        /**
         * Download tracks sequentialy
         * in order to avoid rate limit
         * @param  {array}  uris Spotify track URI list
         */
        function downloadTracks(uris) {
            var promise  = q(),
                promises = [];

            console.log(separator);

            uris.forEach(function(uri) {
                promise = promise.then(function() {
                    console.log('Processing ' + uri);
                    
                    return downloadTrack(uri).then(function(exportPath) {
                        console.log('-> Exported to ' + exportPath);
                    }, function(error) {
                        console.error('-> Error: ' + error);
                    });
                });
                promises.push(promise);
            });

            // All the downloads are completed
            // The End
            q.allSettled(promises).then(function() {
                console.log(separator);
                console.log('Done! Find MP3 in ' + settings.destination);
                console.log(separator);
                
                spotify.disconnect();
            });
        }
        
        /**
         * Download a track
         * @param  {string} uri Spotify track URI
         */
        function downloadTrack(uri) {
            var deferred = q.defer();

            // Get track info
            spotify.get(uri, function (err, track) {
                if (err) {
                    return deferred.reject(err);
                }

                // Metadata
                var artist = track.artist[0].name,
                    album  = track.album.name,
                    song   = track.name,
                    year   = track.album.date.year,
                    number = (track.number < 10 ? '0' : '') + track.number,
                    disc   = track.discNumber,
                    cover  = track.album.cover[2].uri;

                // Create destination folders and path
                var folders = settings.format.split('/'),
                    dest    = settings.destination + '/';

                folders.forEach(function(folderOrFile, i) {

                    // Replace tags by values
                    folderOrFile = folderOrFile
                        .replace('%artist%',   artist)
                        .replace('%album%',    album)
                        .replace('%song%',     song)
                        .replace('%year%',     year)
                        .replace('%number%',   number)
                        .replace('%disc%',     disc)
                        .replace(/[,\/:*?""<>|]/g, '');

                    // Folder
                    if (i !== folders.length - 1) {
                        dest += folderOrFile + '/';

                        if (!fs.existsSync(dest)) {
                            fs.mkdirSync(dest);
                        }
                    // File
                    } else {
                        dest += folderOrFile;
                    }
                });

                var basePath       = path.normalize(dest.replace(settings.destination + '/', '')),
                    mp3Path        = dest + '.mp3',
                    mp3WriteStream = fs.createWriteStream(mp3Path),
                    coverPath      = path.dirname(dest) + '/' + artist + ' - ' + album + '.jpg',
                    coverWriteStream;

                // Pipe cover to a JPG file
                if (!fs.existsSync(coverPath)) {
                    coverWriteStream = fs.createWriteStream(coverPath);

                    https.get(cover, function(response) {
                        response.pipe(coverWriteStream);
                    });
                }

                // Pipe track to a MP3 file
                var playing = track.play().pipe(mp3WriteStream);

                playing.on('error', function(e) {
                    return deferred.reject(e.message);
                });

                playing.on('finish', function () {
                    // Set ID3TAG with eyeD3 command
                    cp.exec([
                        'eyeD3',
                        '--artist="'    + artist    + '"',
                        '--album="'     + album     + '"',
                        '--title="'     + song      + '"',
                        '--year="'      + year      + '"',
                        '--track="'     + number    + '"',
                        '--disc="'      + disc      + '"',
                        '--add-image="' + coverPath + ':FRONT_COVER"',
                                    '"' + mp3Path   + '"'
                    ].join(' '));

                    return deferred.resolve(basePath);
                });
            });

            return deferred.promise;
        }
    });
}

exports.convert = spotifyToMp3;

