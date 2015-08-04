module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'release-helper:open': function () {
        Editor.Panel.open('release-helper.panel');
    },

    'release-helper:query-hosts-infos': function (reply) {
        reply(Editor.versions);
    },

    'release-helper:query-host-version': function (reply, name) {
        reply(Editor.versions[name]);
    },

    'release-helper:exec-cmd': function (reply, cmd, path) {
        var child_process = require('child_process');
        child_process.exec(cmd, {cwd: path}, function(error, stdout, stderr){
            reply(error, stdout, stderr);
        });
    },
};
