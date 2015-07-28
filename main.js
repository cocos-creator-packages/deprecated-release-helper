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
};
