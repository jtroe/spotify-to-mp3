var semver = require('semver'),
    format = require('util').format;

module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        exec: {
            publish: {
                cmd: 'npm publish'
            },
            gitFailIfDirty: {
                cmd: 'test -z "$(git status --porcelain)"'
            },
            gitAdd: {
                cmd: 'git add ./package.json'
            },
            gitCommit: {
                cmd: function(message) {
                    return format('git commit -m "Publish %s"', message);
                }
            },
            gitTag: {
                cmd: function(version) {
                    return format('git tag v%s -am "%s"', version, version);
                }
            },
            gitPush: {
                cmd: [
                    'git push origin master',
                    'git push origin master --tags'
                ].join(' && ')
            }
        }
    });

    grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask('publish', ['exec:publish']);
    grunt.registerTask('default', ['publish']);

    grunt.registerTask('publish', 'Publish lib.', function(version) {
        var pkg = grunt.file.readJSON('package.json');

        version = semver.inc(pkg.version, version) || version;

        if (!semver.valid(version) || semver.lte(version, pkg.version)) {
            grunt.fatal('Invalid version.');
        }

        pkg.version = version;
        grunt.config.data.pkg = pkg;

        grunt.task.run([
            'exec:gitFailIfDirty',
            'manifests:' + version,
            'exec:gitAdd',
            'exec:gitCommit:' + version,
            'exec:gitTag:' + version,
            'exec:gitPush',
            'exec:publish'
        ]);
    });

    grunt.registerTask('manifests', 'Update manifest.', function(version) {
        var pkg = grunt.file.readJSON('package.json');

        pkg.version = version;

        pkg = JSON.stringify(pkg, null, 4);

        grunt.file.write('package.json', pkg);
    });
};