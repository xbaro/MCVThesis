function getFullTreeData(data) {
    var tree_data = [];

    $.each([].concat(data), function(i, g) {
        var group = {
            text: g.type,
            icon: 'glyphicon glyphicon-folder-open',
            type: "group",
            data_object: g,
            tags: [],
            nodes: []
        };

        $.each(g.Children, function (i, sg) {
            var subgroup = {
                text: sg.type,
                icon: 'glyphicon glyphicon-folder-open',
                type: "group",
                data_object: sg,
                tags: [],
                nodes: []
            };

            $.each(sg.Notifications, function(i, n) {
                var notification = {
                    text: n.type,
                    icon: 'glyphicon glyphicon-envelope',
                    type: "notification",
                    data_object: n,
                    tags: []
                };
                subgroup.nodes.push(notification);
            });

            if (subgroup.nodes.length === 0) {
                delete subgroup.nodes;
            }

            group.nodes.push(subgroup);
        });

        $.each(g.Notifications, function(i, n) {
            var notification = {
                text: n.type,
                icon: 'glyphicon glyphicon-envelope',
                type: "notification",
                data_object: n,
                tags: []
            };
            group.nodes.push(notification);
        });

        if (group.nodes.length === 0) {
            delete group.nodes;
        }

        tree_data.push(group);
    });

    return tree_data;
}

var lastScrollValue;
function showNotificationTree(selected) {

    lastScrollValue = $(window).scrollTop();

    $.get('/communication/notifications', {},  'json')
    .done(function( data ) {

        $('#notifications_tree').treeview({data: getFullTreeData(data), showTags: true, levels: 3, color: "#428bca"});
        $('#notifications_tree').treeview('collapseAll', { silent: true });

        $('#notifications_tree').on('nodeSelected', function(event, data) {
            //showMailContent(data);
        });

        $('#notifications_tree').on('nodeUnselected', function(event, data) {
            $('#panel_notifications').empty();
        });

        if(selected) {
            $('#notifications_tree').treeview('selectNode', selected.nodeId);
        }

    }).fail(function() {
        $.notify({
            title: '<strong>Error</strong>',
            message: 'Unexpected error recovering the tree structure',
            newest_on_top: true
        },{
            type: 'danger',
            element: '#tree_messages'
        });
    });
}

jQuery(document).ready(function() {
    showNotificationTree();
});