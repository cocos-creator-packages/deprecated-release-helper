Editor.registerPanel('release-helper.panel',{
    is: 'release-helper',

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
        }
    },

    ready: function () {
        Editor.Package.queryInfos(function ( results ) {
            this.set('packages',results);
        }.bind(this));

        Editor.sendRequestToCore('release-helper:query-hosts-info', function( results ) {
            this.set('hosts',results);
        }.bind(this));
    },
});
