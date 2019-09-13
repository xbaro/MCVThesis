function getFullTreeData(data) {
    var tree_data = [];

    var backColor = {
        pending: "#d8b812b8",
        sent: "#57a016d1",
        failed: "#d8181894"
    };
    $.each([].concat(data), function(i, g) {
        var group = {
            text: g.type,
            icon: 'glyphicon glyphicon-folder-open',
            type: "group",
            backColor: backColor[g.states],
            color: "white",
            data_object: g,
            tags: [],
            nodes: []
        };

        $.each(g.Children, function (i, sg) {
            var subgroup = {
                text: sg.type,
                icon: 'glyphicon glyphicon-folder-open',
                type: "group",
                backColor: backColor[sg.states],
                color: "white",
                data_object: sg,
                tags: [],
                nodes: []
            };

            $.each(sg.Notifications, function(i, n) {
                var notification = {
                    text: n.type,
                    icon: 'glyphicon glyphicon-envelope',
                    type: "notification",
                    backColor: backColor[n.states],
                    color: "white",
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
                backColor: backColor[n.states],
                color: "white",
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

function showMailContent(data) {
    var id = data.data_object.id;
    var html_header = '';
    if (data.data_object.states === 'failed') {
        html_header = '<div class="row"><input type="button" class="btn btn-primary" data-href="/communication/notification/' + id + '/send" value="Resend"></div>';
    }
    $('#panel_notifications').html('');
    if(data.type === 'group') {
        return;
    }
    $.get('/communication/notification/' + id + '/render', {}, 'json')
        .done(function(result) {
           $('#panel_notifications').html(html_header + result.html);
           $("input[type='button']").click(function(e) {
               $.get(this.dataset['href']).done(function(data, status) {
                   if (status === "success") {
                       $.notify({
                           title: '<strong>Informationr</strong>',
                           message: 'Notification sent',
                           newest_on_top: true
                       }, {
                           type: 'info',
                           element: '#tree_messages'
                       });
                   } else {
                       $.notify({
                           title: '<strong>Error</strong>',
                           message: 'Unexpected error sending the notification',
                           newest_on_top: true
                       }, {
                           type: 'danger',
                           element: '#tree_messages'
                       });
                   }
               });
           });
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

var lastScrollValue;
function showNotificationTree(period_id) {

    lastScrollValue = $(window).scrollTop();

    $.get('/communication/notifications/' + period_id, {},  'json')
    .done(function( data ) {

        $('#notifications_tree').treeview({data: getFullTreeData(data), showTags: true, levels: 3, color: "#428bca"});
        $('#notifications_tree').treeview('collapseAll', { silent: true });

        $('#notifications_tree').on('nodeSelected', function(event, data) {
            showMailContent(data);
        });

        $('#notifications_tree').on('nodeUnselected', function(event, data) {
            $('#panel_notifications').empty();
        });

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
    $('#index_periodsTable').bootstrapTable({
        data: active_periods
    });
    $('#index_periodsTable').on('check.bs.table', function (e, row, $element) {
        showNotificationTree(row.id);
    });
    $("input[type='button']").click(function(e) {
       $.get(this.dataset['href']).done(function(data, status) {
           if (status === "success") {
               $.notify({
                   title: '<strong>Informationr</strong>',
                   message: 'Notification sent',
                   newest_on_top: true
               }, {
                   type: 'info',
                   element: '#tree_messages'
               });
           } else {
               $.notify({
                   title: '<strong>Error</strong>',
                   message: 'Unexpected error sending the notification',
                   newest_on_top: true
               }, {
                   type: 'danger',
                   element: '#tree_messages'
               });
           }
       });
    });
});