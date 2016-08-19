function getTreeData(data) {
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
                    tags: [s.capacity]
                };
                track.nodes.push(slot);
            });

            period.nodes.push(track);
        });
        tree_data.push(period);
    });

    return tree_data;
}


function showTree() {
    var selectedPeriods = $('#periodsTable').bootstrapTable('getSelections');
    if (selectedPeriods.length>0) {
        $.get('/admin/tracks/' + selectedPeriods[0].id, {},  'json')
        .done(function( data ) {
            $('#btnAddElement').addClass('disabled');
            $('#btnEditElement').addClass('disabled');
            $('#btnDelElement').addClass('disabled');

            $('#slots_tree').treeview({data: getTreeData(data), showTags: true, levels: 3});

            $('#slots_tree').on('nodeSelected', function(event, data) {
                $('#btnEditElement').removeClass('disabled');
                $('#btnDelElement').removeClass('disabled');

                if(data.type != 'slot') {
                    $('#btnAddElement').removeClass('disabled');
                }
            });

            $('#slots_tree').on('nodeUnselected', function(event, data) {
                $('#btnAddElement').addClass('disabled');
                $('#btnEditElement').addClass('disabled');
                $('#btnDelElement').addClass('disabled');
            });

        }).fail(function() {
            $.notify({
                title: '<strong>Error</strong>',
                message: 'Unexpected error recovering the tree structure',
                newest_on_top: true
            },{
                type: 'danger',
                element: '#treeForm_messages'
            });
        });
    }

}

jQuery(document).ready(function() {

    $('#btnAddElement').on('click', function(e) {
        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            return;
        }

        $('#btnAddElement').addClass('disabled');
        $('#btnEditElement').addClass('disabled');
        $('#btnDelElement').addClass('disabled');

        switch(selectedNodes[0].type) {
            case 'period':
                // Reset the form
                $('#trackFormModal').find('form').trigger("reset");
                // Store the period id
                $('#track_period_id').val(selectedNodes[0].data_object.id);
                // Prepare the form for addition
                $('#trackFormModal').find('.modal-title').text('Add new track');
                $('#trackFormModal').find('.btn-primary').text('Add');
                $('#trackFormModal').find('.btn-primary').data('action', 'add');
                // Show the window
                $('#trackFormModal').modal('show', $('#btnAddElement'));
                break;
            case 'track':
                // Reset the form
                $('#slotFormModal').find('form').trigger("reset");
                // Store the track id
                $('#slot_track_id').val(selectedNodes[0].data_object.id);
                // Prepare the form for addition
                $('#slotFormModal').find('.modal-title').text('Add new slot');
                $('#slotFormModal').find('.btn-primary').text('Add');
                $('#slotFormModal').find('.btn-primary').data('action', 'add');
                // Show the window
                $('#slotFormModal').modal('show', $('#btnAddElement'));
                break;
        }
    });

    $('#btnEditElement').on('click', function(e) {
        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            return;
        }

        switch(selectedNodes[0].type) {
            case 'track':
                // Prepare the form for edition
                $('#trackFormModal').find('.modal-title').text('Edit track data');
                $('#trackFormModal').find('.btn-primary').text('Update');
                $('#trackFormModal').find('.btn-primary').data('action', 'edit');

                // Get the data
                var row = selectedNodes[0].data_object;
                $('#track_id').val(row.id);
                $('#track_title').val(row.title);
                $('#track_keywords').val(row.keywords);

                // Show the window
                $('#trackFormModal').modal('show', $('#btnAddElement'));
                break;
            case 'slot':
                // Prepare the form for addition
                $('#slotFormModal').find('.modal-title').text('Edit slot data');
                $('#slotFormModal').find('.btn-primary').text('Update');
                $('#slotFormModal').find('.btn-primary').data('action', 'edit');

                // Get the data
                var row = selectedNodes[0].data_object;
                $('#slot_id').val(row.id);
                $('#slot_place').val(row.place);
                $('#slot_capacity').val(row.capacity);
                $('#slot_date').setFormatedDate(row.start);
                $('#slot_start_time').setFormatedTime(row.start);
                $('#slot_end_time').setFormatedTime(row.end);

                // Show the window
                $('#slotFormModal').modal('show', $('#btnAddElement'));
                break;
        }
    });

    $('#btnDelElement').on('click', function(e) {

        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            return;
        }

        // Get the id
        var id = selectedNodes[0].data_object.id;
        var type = selectedNodes[0].type;

        bootbox.confirm("You will remove the " + type + " and all the related information.",
            function (result) {
                if (result) {
                    $.post("/admin/" + type + "/delete", {id: id}, 'json')
                        .done(function (data) {
                            if(data.hasOwnProperty('error') && !data.error) {

                                // Refresh the information
                                showTree();

                                $.notify({
                                    title: '<strong>Period removed</strong>',
                                    message: '<strong>' + strCapitalize(type) + '</strong> has been removed].',
                                    newest_on_top: true
                                }, {
                                    type: 'success',
                                    element: '#treeForm_messages',
                                    'placement.from': 'bottom'
                                });
                            } else {
                                $.notify({
                                    title: '<strong>Error</strong>',
                                    message: 'Unexpected error processing the request [action=delete, ' + type + '=' + id + '].',
                                    newest_on_top: true
                                },{
                                    type: 'danger',
                                    element: '#treeForm_messages',
                                    'placement.from': 'bottom'
                                });
                            }
                        }).fail(function() {
                            $.notify({
                                title: '<strong>Error</strong>',
                                message: 'Unexpected error processing the request [action=delete, ' + type + '=' + id + '].',
                                newest_on_top: true
                            },{
                                type: 'danger',
                                element: '#treeForm_messages',
                                'placement.from': 'bottom'
                            });
                    });
                }
            });

    });

    $('#btnAcceptTrack').on('click', function(e) {
        var action = $(this).data('action');

        // Get the data from the form
        var track = $('#trackFormModal').find('form').serializeFormJSON();

        // Set the action
        var post_action = '';
        var msg_title = 'Error';
        var msg_body = '';
        switch (action) {
            case 'add':
                post_action = '/admin/track/new';
                msg_title = 'Add new track';
                msg_body = 'Created track <strong>' + track.title + '</strong>';
                break;
            case 'edit':
                post_action = '/admin/track/update';
                msg_title = 'Update track';
                msg_body = 'Track <strong>' + track.title + '</strong> successfully updated'
                break;
        }

        // Perform the action
        $.post(post_action, track, 'json')
            .done(function( data ) {
                // Reload the tree data
                showTree();

                // Show the message
                if(!data.error) {
                    $.notify({
                        title: '<strong>' + msg_title +'</strong>',
                        message: msg_body,
                        newest_on_top: true
                    }, {
                        type: 'success',
                        element: '#treeForm_messages'
                    });
                    // Close the modal form
                    $('#trackFormModal').modal('hide');
                } else {
                    $.notify({
                        title: '<strong>Error</strong>',
                        message: 'Unexpected error processing the request [action='+ action + ', msg=' + data.message + '].',
                        newest_on_top: true
                    },{
                        type: 'danger',
                        element: '#track_modalBody'
                    });
                }

        }).fail(function() {
            $.notify({
                title: '<strong>Error</strong>',
                message: 'Unexpected error processing the request [action='+ action + ', track=' + track.title + '].',
                newest_on_top: true
            },{
                type: 'danger',
                element: '#track_modalBody'
            });
        });

    });

    $('#btnAcceptSlot').on('click', function(e) {
        var action = $(this).data('action');

        // Get the data from the form
        var slot = $('#slotFormModal').find('form').serializeFormJSON();

        // Process special fields
        if (slot.date && slot.start_time) {
            slot.start = slot.date + ' ' + slot.start_time;
        }
        if (slot.date && slot.end_time) {
            slot.end = slot.date + ' ' + slot.end_time;
        }

        // Set the action
        var post_action = '';
        var msg_title = 'Error';
        var msg_body = '';
        switch (action) {
            case 'add':
                post_action = '/admin/slot/new';
                msg_title = 'Add new slot';
                msg_body = 'Created slot at <strong>' + slot.place + '</strong>';
                break;
            case 'edit':
                post_action = '/admin/slot/update';
                msg_title = 'Update slot';
                msg_body = 'Slot at <strong>' + slot.place + '</strong> successfully updated'
                break;
        }

        // Perform the action
        $.post(post_action, slot, 'json')
            .done(function( data ) {
                // Reload the tree data
                showTree();

                // Show the message
                if(!data.error) {
                    $.notify({
                        title: '<strong>' + msg_title +'</strong>',
                        message: msg_body,
                        newest_on_top: true
                    }, {
                        type: 'success',
                        element: '#treeForm_messages'
                    });
                    // Close the modal form
                    $('#slotFormModal').modal('hide');
                } else {
                    $.notify({
                        title: '<strong>Error</strong>',
                        message: 'Unexpected error processing the request [action='+ action + ', msg=' + data.message + '].',
                        newest_on_top: true
                    },{
                        type: 'danger',
                        element: '#slot_modalBody'
                    });
                }

        }).fail(function() {
            $.notify({
                title: '<strong>Error</strong>',
                message: 'Unexpected error processing the request [action='+ action + ', slot=' + slot.id + '].',
                newest_on_top: true
            },{
                type: 'danger',
                element: '#slot_modalBody'
            });
        });

    });
});