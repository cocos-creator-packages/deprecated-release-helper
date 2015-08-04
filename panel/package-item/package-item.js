var Fs = require('fire-fs');
var Async = require('async');
var Shell = require('shell');
var Semver = require('semver');
var Path = require('fire-path');

Polymer({
    is: 'package-item',

    properties: {
        value: {
            type: Array,
            value: function () {
                return [];
            }
        },

        folded: {
            type: Boolean,
            value: false,
            reflectToAttribute: true,
        },

        _dirty: {
            type: Boolean,
            value: false,
            reflectToAttribute: true,
        },

        invalid: {
            type: Boolean,
            value: false,
        },

        _checked: {
            type: Boolean,
            value: false,
        },

        tag: {
            type: String,
            value: '',
        },
    },

    ready: function () {
        this.oldVersion = this.value.info.version;
        this.syncGitTag();
    },

    _cancelSelect: function () {
        this._checked = false;
    },

    obj2Array: function (obj) {
        var array = [];
        for (var item in obj) {
            array.push({name: item, version: obj[item]});
        }
        return array;
    },

    formatTag: function (tag) {
        if (!tag) {
            return 'NO TAG';
        }
        return tag;
    },

    _onFoldClick: function (event) {
        event.stopPropagation();
        this.folded = !this.folded;
    },

    _versionChanged: function (event) {
        this.verify(event.target);
        if (!Semver.gt(event.target.value, this.oldVersion)) {
            event.target.value = this.oldVersion;
        }
        this.setDirty();
    },

    _onHostChanged: function (event) {
        this.verify(event.target);
        var keyName = this.$.hostVersionTemplate.itemForElement(event.target).name;
        this.value.info.hosts[keyName] = event.target.value;
        this.setDirty();
    },

    _onDependenciesChanged: function (event) {
        this.verify(event.target);
        var keyName = this.$.depVersionTemplate.itemForElement(event.target).name;
        this.value.info.dependencies[keyName] = event.target.value;
        this.setDirty();
    },

    setDirty: function () {
        this.fire('item-dirty');
        this._dirty = true;
    },

    syncGitTag: function (cb) {
        var path = this.value.path;
        var commands = 'git for-each-ref --sort=taggerdate refs/tags --format \'%(refname)\'';
        Editor.sendRequestToCore('release-helper:exec-cmd', commands, path, function( error,stdout,stderr ) {
            if (!error) {
                if (!stdout) {
                    this.set('tag','');
                    if (cb) {
                        cb();
                    }
                    return;
                }
                var tags = stdout.split('\n');
                var reftags = tags[tags.length - 2];
                var tag = reftags.split('/');
                tag = tag[tag.length-1];
                this.set('tag',tag);
                if (cb) {
                    cb(this.tag);
                }
            }
            else {
                Editor.error(stderr);
            }
        }.bind(this));
    },

    fetchTag: function (cb) {
        var path = this.value.path;
        this.$.loader.hidden = false;
        Async.series([
            function (next) {
                var commands = 'git tag -l | xargs git tag -d';
                Editor.sendRequestToCore('release-helper:exec-cmd', commands, path, function( error, stdout, stderr ) {
                    if (!error) {
                        next();
                    }
                    else {
                        Editor.error(stderr);
                    }
                });
            },

            function (next) {
                var commands = 'git fetch --tags';
                Editor.sendRequestToCore('release-helper:exec-cmd', commands, path, function( error, stdout, stderr ) {
                    if (!error) {
                        next();
                    }
                    else {
                        Editor.error(stderr);
                    }
                });
            } ,
        ],function () {
            if (cb) {
                this.$.loader.hidden = true;
                cb();
            }
        }.bind(this));
    },

    confirm: function () {
        Fs.readFile(Path.join(this.value.path, 'package.json'), function (err, data) {
            if (!err) {
                var obj = JSON.parse(data.toString());
                obj.version = this.value.info.version;
                obj.hosts = this.value.info.hosts;
                obj.dependencies = this.value.info.hosts;
                obj.dependencies = this.value.info.dependencies;
                var json = JSON.stringify(obj, null, 2);
                Fs.writeFile( Path.join(this.value.path, 'package.json'), json, function (err, state) {
                    if (err) {
                        Editor.error(err);
                    }
                });
            }
            else {
                Editor.error(err);
            }
        }.bind(this));

        this._dirty = false;
    },

    verify: function (target) {
        // Checking the version's format
        if (!/^(=|>=|<=|>|<|\^|)[0-9]+\.[0-9]+\.([0-9]+|x)$/.test(target.value)) {
            target.invalid = true;
            this.folded = true;
        }
        else {
            target.invalid = false;
        }
    },

    _foldClass: function (folded) {
        if (folded) {
            return 'icon pointer fa fa-caret-down';
        }
        return 'icon pointer fa fa-caret-right';
    },

    _onShowinFinderClick: function (event) {
        event.stopPropagation();
        Shell.showItemInFolder(this.value.path);
        Shell.beep();
    },

    updateVersion: function (type) {
        this.set('value.info.version',Semver.inc(this.value.info.version,type));
    },

    _refreshDependencies: function (event) {
        event.stopPropagation();
        var keyName = this.$.deptemplate.itemForElement(event.target).name;

        Editor.Package.queryInfo(keyName,function (res) {
            var dependencies = this.value.info.dependencies;
            var modifier = dependencies[keyName].substr(0, dependencies[keyName].indexOf(dependencies[keyName].match(/[0-9]+/)[0]));
            dependencies[keyName] = modifier + res.info.version;
            this.set('value.info.dependencies', dependencies);
        }.bind(this));
    },

    _refreshHosts: function (event) {
        event.stopPropagation();

        var keyName = this.$.hoststemplate.itemForElement(event.target).name;
        Editor.sendRequestToCore('release-helper:query-host-version', keyName, function( version ) {
            var hosts = this.value.info.hosts;
            var modifier = hosts[keyName].substr(0, hosts[keyName].indexOf(hosts[keyName].match(/[0-9]+/)[0]));
            hosts[keyName] = modifier + version;
            this.set('value.info.hosts', hosts);
        }.bind(this));
    },

    resetTag: function () {
        var path = this.value.path;
        var commands = 'git tag ' + this.tag + ' -d';
        Editor.sendRequestToCore('release-helper:exec-cmd', commands, path, function( error, stdout, stderr ) {
            if (!error) {
                this.syncGitTag();
            }
            else {
                Editor.error(this.value.info.name + ': ' + stderr);
            }
        }.bind(this));
    },

    _tagClass: function (tag, version) {
        if (tag === version) {
            return 'tag mini green';
        }
        else {
            return 'tag mini red';
        }
    },
});
