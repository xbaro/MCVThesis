function getFullTreeData(data) {
    var tree_data = [];

    $.each([].concat(data), function(i, p) {
        var period_remaining_members = 0;
        var tags = [];

        var period = {
            text: p.title,
            type: "period",
            data_object: p,
            tags: [],
            nodes: []
        };

        $.each(p.Tracks, function (i, t) {
            var track_remaining_members = 0;
            var track = {
                text: t.title,
                icon: 'glyphicon glyphicon-th-list',
                type: "track",
                data_object: t,
                tags: [],
                nodes: []
            };

            $.each(t.Slots, function(i, s) {
                var slot_remaining_members = 0;
                var text = '';
                if (s.start) {
                    var ds = new Date(s.start);
                    text += ds.toLocaleDateString();
                    text += '   ' + ("0" + ds.getHours()).slice(-2) + ':' + ("0" + ds.getMinutes()).slice(-2);
                }
                text += '-';
                if (s.end) {
                    var de = new Date(s.end);
                    text += ("0" + de.getHours()).slice(-2) + ':' + ("0" + de.getMinutes()).slice(-2);
                }
                text += '   @ ' + s.place;
                var slot = {
                    text: text,
                    icon: 'glyphicon glyphicon-calendar',
                    type: "slot",
                    data_object: s,
                    tags: [],
                    nodes: []
                };

                $.each(s.Theses, function(i, st) {
                    slot_remaining_members += 3 - st.Committees.length;
                });

                if (slot.nodes.length == 0) {
                    delete slot.nodes;
                }

                slot.tags.push(slot_remaining_members);
                track_remaining_members += slot_remaining_members;

                track.nodes.push(slot);
            });

            if (track.nodes.length == 0) {
                delete track.nodes;
            }

            track.tags.push(track_remaining_members);
            period_remaining_members += track_remaining_members;

            period.nodes.push(track);
        });

        if (period.nodes.length == 0) {
            delete period.nodes;
        }

        period.tags.push(period_remaining_members);
        tree_data.push(period);
    });

    return tree_data;
}

var lastScrollValue;
function showPeriodsTree(selected) {

    lastScrollValue = $(window).scrollTop();

    $.get('/committees/periods/open', {},  'json')
    .done(function( data ) {

        $('#committee_tree').treeview({data: getFullTreeData(data), showTags: true, levels: 3, color: "#428bca"});

        $('#committee_tree').on('nodeSelected', function(event, data) {
            showUnassignedTheses(data);
        });

        $('#committee_tree').on('nodeUnselected', function(event, data) {
            $('#panel_Theses').empty();
        });

        if(selected) {
            $('#committee_tree').treeview('selectNode', selected.nodeId);
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

var current_user;

jQuery(document).ready(function() {

    $.get( "/thesis/user_data").done(function( data ) {
        current_user = data;
        showPeriodsTree();
    });

});