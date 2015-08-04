var Async = require('async');
var GitUtils = require('git-utils');

Editor.registerPanel('release-helper.panel',{
    is: 'release-helper',

    listeners: {
        'item-dirty' : '_onItemDirtyChanged'
    },

    properties: {
        hosts: {
            type: Array,
            value: function () {
                return [];
            },
        },

        packages: {
            type: Array,
            value: function () {
                return [];
            },
        },

        dirty: {
            type: Boolean,
            value: false,
            reflectToAttribute: true,
        },
    },

    ready: function () {
        this._queryInfos();
    },

    _queryInfos: function (cb) {
        this.$.loader.hidden = false;

        Async.series([

            function (next) {
                Editor.Package.queryInfos(function ( results ) {
                    this.set('packages', results);
                    next();
                }.bind(this));
            }.bind(this),

            function (next) {
                Editor.sendRequestToCore('release-helper:query-hosts-infos', function( results ) {
                    var hosts = [];
                    for (var item in results) {
                        hosts.push({name: item, version: results[item]});
                    }
                    this.set('hosts', hosts);
                    next();
                }.bind(this));
            }.bind(this),

        ],function () {
            this.$.loader.hidden = true;
            if (cb) {
                cb();
            }
        }.bind(this));
    },

    refresh: function () {
        this.set('packages', []);
        this.set('hosts', []);
        this.dirty = false;
        this.$.checkbox.checked = false;

        requestAnimationFrame(function () {
            this._queryInfos();
        }.bind(this));
    },

    _onItemDirtyChanged: function () {
        this.dirty = true;
    },

    _getAllPackages: function () {
        return this.$.items.getElementsByTagName('package-item');
    },

    _getAllCheckedItems: function () {
        var packages = this._getAllPackages();
        var items = [];
        for (var i = 0; i < packages.length; ++i) {
            if (packages[i]._checked) {
                items.push(packages[i]);
            }
        }
        return items;
    },

    cancel: function () {
        var packages = this._getAllPackages();

        this._queryInfos(function () {
            requestAnimationFrame(function () {
                for (var i = 0; i < packages.length; ++i) {
                    packages[i]._dirty = false;
                    this.dirty = false;
                }
            }.bind(this));
        }.bind(this));
    },

    confirm: function () {
        var packages = this._getAllCheckedItems();
        if (packages.length <= 0) {
            return;
        }
        for (var i = 0; i < packages.length; ++i) {
            packages[i].confirm();
        }

        this.dirty = false;
    },

    _hasModified: function (path) {
        var repository = GitUtils.open(path);
        for (var name in repository.getStatus()) {
            return true;
        }
        return false;
    },

    _resetTag: function (path,tag,cb) {
        Async.series([
            function (next) {
                var resetCommand =' git tag ' + tag + ' -d';
                Editor.sendRequestToCore('release-helper:exec-cmd', resetCommand, path, function( error,stdout,stderr ) {
                    if (!error) {
                        next();
                    }
                }.bind(this));
            },

            function (next) {
                var cmd = 'git tag -a ' + tag + ' -m ' + '\' add tag  from "release-helper". date: ' + new Date() + ' \'';
                Editor.sendRequestToCore('release-helper:exec-cmd', cmd, path, function( error, stdout, stderr ) {
                    if (!error) {
                        cb();
                    }
                });
            },
        ],function () {
            cb();
        }.bind(this));
    },

    setTags: function () {
        var packages = this._getAllCheckedItems();
        var j = 0;
        var confirmTags = function () {
            if (j >= packages.length ) {
                return;
            }
            // check the git status
            if ( this._hasModified(packages[j].value.path) ) {
                var cmd = 'git tag -a ' + packages[j].value.info.version + ' -m ' + '\' add tag  from "release-helper". date: ' + new Date() + ' \'';
                var path = packages[j].value.path;
                Editor.sendRequestToCore('release-helper:exec-cmd', cmd,path, function( error, stdout, stderr ) {
                        // if the tag already exists, 1.delete the tag 2.set the same tag again.
                        if (error && stderr.indexOf('already exists') > -1) {
                            this._resetTag(packages[j].value.path, packages[j].value.info.version, function () {
                                packages[j].syncGitTag();
                                j++;
                                confirmTags();
                            });
                        }
                        else {
                            packages[j].syncGitTag();
                            j++;
                            confirmTags();
                        }
                }.bind(this));
            }
            else {
                Editor.warn( packages[j].value.path + ': "' + packages[j].value.info.name + '" has modified,please commit first!');
            }
        }.bind(this);

        confirmTags();
    },

    _onAddTagClick: function (event) {
        event.stopPropagation();

        this.setTags();
    },

    _onFetchTagsClick: function (event) {
        event.stopPropagation();

        var packages = this._getAllCheckedItems();
        var i = 0;
        var fetchTag = function () {
            if (i >= packages.length) {
                return;
            }
            packages[i].fetchTag( function () {
                packages[i].syncGitTag( function () {
                    i++;
                    fetchTag();
                });
            });
        };

        fetchTag();
    },

    _onSelectChanged: function (event) {
        event.stopPropagation();

        var selected = event.target.checked;
        var packages = this._getAllPackages();
        for (var i = 0; i < packages.length; ++i) {
            packages[i]._checked = selected;
        }
    },

    _increaseVersion: function(event) {
        event.stopPropagation();

        var packages = this._getAllCheckedItems();
        for (var i = 0; i < packages.length; ++i) {
            packages[i].updateVersion(this.$.select.value);
        }
    },
});
