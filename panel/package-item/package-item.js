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
        }
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

    _foldClass: function (folded) {
        if (folded) {
            return 'icon fa fa-caret-down';
        }
        return 'icon fa fa-caret-right';
    }
});
