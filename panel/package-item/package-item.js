var Fs = require('fs');
var Shell = require('shell');
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
        }
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

    _onFoldClick: function (event) {
        event.stopPropagation();
        this.folded = !this.folded;
    },

    _versionChanged: function (event) {
        this.verify(event.target);
        this.callDirty();
    },

    _onHostChanged: function (event) {
        this.verify(event.target);
        var keyName = event.target.getAttribute('data-name');
        this.value.info.hosts[keyName] = event.target.value;
        this.callDirty();
    },

    _onDependenciesChanged: function (event) {
        this.verify(event.target);
        var keyName = event.target.getAttribute('data-name');
        this.value.info.dependencies[keyName] = event.target.value;
        this.callDirty();
    },

    callDirty: function () {
        this.fire('dirty-changed');
        this._dirty = true;
    },

    confirm: function () {
        Fs.readFile(this.value.path + '/package.json',function (err,data) {
            if (!err) {
                var obj = JSON.parse(data.toString());
                obj.version = this.value.info.version;
                obj.hosts = this.value.info.hosts;
                obj.dependencies = this.value.info.hosts;
                obj.dependencies = this.value.info.dependencies;
                var json = WebCodeBeauty.json(JSON.stringify(obj),2);
                Fs.writeFile( this.value.path + '/package.json', json,function (err,state) {
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
            return 'icon fa fa-caret-down';
        }
        return 'icon fa fa-caret-right';
    },

    _onOpenFoldClick: function (event) {
        event.stopPropagation();
        Shell.showItemInFolder(this.value.path);
        Shell.beep();
    },

    calculatedVersion: function (seat,append) {
        var version = this.value.info.version;
        var tmp = version.split('.')[parseInt(seat)];
        var number = tmp.match(/[0-9]+/)[0];
        var modifier = tmp.substr(0, tmp.indexOf(tmp.match(/[0-9]+/)[0]));
        if (append) {
            number = modifier + (Math.clamp(parseInt(number) + 1, 0, Number.MAX_VALUE));
        }
        else {
            number = modifier + (Math.clamp(parseInt(number) - 1, 0, Number.MAX_VALUE));
        }

        switch (seat) {
            case '0':
                this.set('value.info.version', number + '.' +
                version.split('.')[1] + '.' +
                version.split('.')[2]);
                break;
            case '1':
                this.set('value.info.version',version.split('.')[0] + '.' +
                number + '.' +
                version.split('.')[2]);
                break;
            case '2':
                this.set('value.info.version',version.split('.')[0] + '.' +
                version.split('.')[1] + '.' +
                number);
                break;
        }
    },

    _refreshDependencies: function (event) {
        event.stopPropagation();
        var keyName = event.target.getAttribute('name');
        Editor.Package.queryInfo(keyName,function (res) {
            var dependencies = this.value.info.dependencies;
            var modifier = dependencies[keyName].substr(0, dependencies[keyName].indexOf(dependencies[keyName].match(/[0-9]+/)[0]));
            dependencies[keyName] = modifier + res.info.version;
            this.set('value.info.dependencies',[]);
            this.set('value.info.dependencies',dependencies);
        }.bind(this));
    },

    _refreshHosts: function (event) {
        event.stopPropagation();

        var keyName = event.target.getAttribute('name');
        Editor.sendRequestToCore('release-helper:query-hosts-info', function( host, versions ) {
            var hosts = this.value.info.hosts;
            var modifier = hosts[keyName].substr(0, hosts[keyName].indexOf(hosts[keyName].match(/[0-9]+/)[0]));
            hosts[keyName] = modifier + versions[keyName];

            this.set('value.info.hosts',[]);
            this.set('value.info.hosts',hosts);
        }.bind(this));
    },
});
