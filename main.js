module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'release-helper:open': function () {
        Editor.Panel.open('release-helper.panel');
    },

    'release-helper:query-hosts-info': function (reply) {
        reply(Editor.versions);
    },

    'release-helper:query-host-version': function (reply,name) {
        reply(Editor.versions[name]);
    },

    'release-helper:exec_cmd': function (reply,cmd) {
        var child_process = require('child_process');
        child_process.exec(cmd,function(error, stdout, stderr){
            reply(error, stdout, stderr);
        });
    },
};
