module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'release-helper:open': function () {
        Editor.Panel.open('release-helper.panel');
    },

    'release-helper:query-hosts-info': function (reply) {
        var hosts = [];
        for (var item in Editor.versions) {
            hosts.push({name: item, version: Editor.versions[item]});
        }
        reply(hosts,Editor.versions);
    },

    'release-helper:child_process': function (reply,cmd) {
        var child_process = require('child_process');
        child_process.exec(cmd,function(error, stdout, stderr){
            reply(error, stdout, stderr);
        });
    },
};
