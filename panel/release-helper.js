var Async = require('async');

Editor.registerPanel('release-helper.panel',{
    is: 'release-helper',

    listeners: {
        'dirty-changed' : '_onDirtyChanged'
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
        }
    },

    ready: function () {
        this._queryInfos();
    },

    _queryInfos: function (cb) {
        this.$.loader.hidden = false;

        Async.series([

            function (next) {
                Editor.Package.queryInfos(function ( results ) {
                    this.set('packages',results);
                    next();
                }.bind(this));
            }.bind(this),

            function (next) {
                Editor.sendRequestToCore('release-helper:query-hosts-info', function( host, versions ) {
                    this.set('hosts',host);
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

    refrensh: function () {
        this.set('packages',[]);
        this.set('hosts',[]);
        this.dirty = false;
        this.$.checkbox.checked = false;

        requestAnimationFrame(function () {
            this._queryInfos();
        }.bind(this));
    },

    _onDirtyChanged: function () {
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

    // NOTE: 批量设置TAG 
    setAllTag: function (tag,cb) {
        var cmd = 'git tag -a ' + tag + " -m " + '\'add tag \'';
        var commands = '';
        var packages = this._getAllCheckedItems();
        for (var i = 0; i < packages.length; ++i) {
            commands += 'cd ' + this.packages[i].value.path + '&& ';
            commands += cmd + '\r\n';
        }
        child_process.exec(commands,function(error, stdout, stderr){
            if (!error) {
                Editor.success('add tag all done!');
                cb(error,stdout);
            }
            else {
                Editor.error(stderr);
            }
        });
    },

    _onSelectChanged: function (event) {
        var selectAll = event.target.checked;
        var packages = this._getAllPackages();
        for (var i = 0; i < packages.length; ++i) {
            packages[i]._checked = selectAll;
        }
    },

    _appendVersion: function() {
        var packages = this._getAllCheckedItems();
        for (var i = 0; i < packages.length; ++i) {
            packages[i].calculatedVersion(this.$.select.value,true);
        }
    },

    _decreaseVersion: function () {
        var packages = this._getAllCheckedItems();
        for (var i = 0; i < packages.length; ++i) {
            packages[i].calculatedVersion(this.$.select.value,false);
        }
    },
});
