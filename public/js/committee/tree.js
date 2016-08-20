function getFullTreeData(data) {
    var tree_data = [];

    $.each([].concat(data), function(i, p) {
        var tags = [];
        if(p.active) {
            tags.push('active');
        }
        if(p.closed) {
            tags.push('closed');
        }

        var period = {
            text: p.title,
            type: "period",
            data_object: p,
            tags: tags,
            nodes: []
        };

        $.each(p.Tracks, function (i, t) {
            var track = {
                text: t.title,
                icon: 'glyphicon glyphicon-th-list',
                tags: t.keywords.split(','),
                type: "track",
                data_object: t,
                nodes: []
            };

            $.each(t.Slots, function(i, s) {
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
                    tags: [s.capacity],
                    nodes: []
                };

                $.each(s.Theses, function(i, ts) {
                    var thesis = {
                        text: ts.title,
                        icon: 'glyphicon glyphicon-book',
                        type: "thesis",
                        data_object: ts
                    };
                    slot.nodes.push(thesis);
                });
                track.nodes.push(slot);
            });

            period.nodes.push(track);
        });
        tree_data.push(period);
    });

    return tree_data;
}


function showPeriodsTree() {
    $.get('/committees/periods/open', {},  'json')
    .done(function( data ) {

        $('#committee_tree').treeview({data: getFullTreeData(data), showTags: true, levels: 3, color: "#428bca"});

        $('#committee_tree').on('nodeSelected', function(event, data) {

        });

        $('#committee_tree').on('nodeUnselected', function(event, data) {

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
    showPeriodsTree();
});