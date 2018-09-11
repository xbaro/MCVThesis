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
                text += '   @ ' + s.place + '[Room: ' + s.room + ']';
                var capacity = 0;
                if (s.capacity) {
                    capacity=s.capacity;
                }
                var slot = {
                    text: text,
                    icon: 'glyphicon glyphicon-calendar',
                    type: "slot",
                    data_object: s,
                    tags: [capacity-s.Theses.length],
                    nodes: []
                };

                $.each(s.Theses, function(i, ts) {
                    var thesis = {
                        text: '<strong>' + ts.User.full_name + '</strong><p>' + ts.title + '</p>',
                        icon: 'glyphicon glyphicon-book',
                        type: "thesis",
                        data_object: ts
                    };
                    slot.nodes.push(thesis);
                });
                if (slot.nodes.length == 0) {
                    delete slot.nodes;
                }

                track.nodes.push(slot);
            });

            if (track.nodes.length == 0) {
                delete track.nodes;
            }

            period.nodes.push(track);
        });

        if (period.nodes.length == 0) {
            delete period.nodes;
        }
        tree_data.push(period);
    });

    return tree_data;
}


function showTree(selected) {

    // Disable drag thesis
    //$('.unassigned-thesis').draggable( "option", "disabled", true );

    var selectedPeriods = $('#periodsTable').bootstrapTable('getSelections');
    if (selectedPeriods.length>0) {
        $.get('/admin/tracks/' + selectedPeriods[0].id, {},  'json')
        .done(function( data ) {
            $('#btnAddElement').addClass('disabled');
            $('#btnEditElement').addClass('disabled');
            $('#btnDelElement').addClass('disabled');
            $('#btnFixOrder').addClass('disabled');

            $('#slots_tree').treeview({data: getTreeData(data), showTags: true, levels: 3, color: "#428bca"});

            if(selected) {
                $('#slots_tree').treeview('selectNode', selected.nodeId);
            }

            $('#slots_tree').on('nodeSelected', function(event, data) {
                if(data.type != 'period' && data.type != 'thesis') {
                    $('#btnEditElement').removeClass('disabled');
                    $('#btnDelElement').removeClass('disabled');
                }

                if(data.type == 'period' || data.type == 'track') {
                    $('#btnAddElement').removeClass('disabled');
                }

                if(data.type == 'slot') {
                    // Enable drag thesis
                    $('.unassigned-thesis').draggable( "option", "disabled", false );
                    $('.add_thesis_slot').prop("disabled",false);
                    $('#btnFixOrder').removeClass('disabled');
                } else {
                    $('.unassigned-thesis').draggable( "option", "disabled", true );
                    $('.add_thesis_slot').prop("disabled",true);
                    $('#btnFixOrder').addClass('disabled');
                }

                if(data.type == 'thesis') {
                    var slotNode = $('#slots_tree').treeview('getParent', data);
                    if(data.nodeId != slotNode.nodes[0].nodeId) {
                        $('#btnThesisUp').removeClass('disabled');
                    }
                    if(data.nodeId != slotNode.nodes[slotNode.nodes.length-1].nodeId) {
                        $('#btnThesisDown').removeClass('disabled');
                    }
                    $('#btnThesisRemove').removeClass('disabled');
                }
                $( "#slots_tree" ).droppable({
                    accept: ".unassigned-thesis",
                    classes: {
                        "ui-droppable-active": "ui-state-default"
                    },
                    drop: function( event, ui ) {
                        if (data.type != 'slot') {
                            return;
                        }
                        var slotId = data.data_object.id;
                        var thesisID = ui.draggable.attr('id').split('_')[1];

                        $.post( "/admin/thesis/" + thesisID + "/assign", {slot_id: slotId}, 'json').done(function( result ) {
                            if(result) {
                                showTree(data);
                                showUnassignedTheses();
                            }
                        });
                    }
                });
            });

            $('#slots_tree').on('nodeUnselected', function(event, data) {
                $('#btnAddElement').addClass('disabled');
                $('#btnEditElement').addClass('disabled');
                $('#btnDelElement').addClass('disabled');

                $('#btnThesisUp').addClass('disabled');
                $('#btnThesisDown').addClass('disabled');
                $('#btnThesisRemove').addClass('disabled');
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

function addThesis(thesis, parent) {

    var id = 'thesis_' + thesis['id'];
    var advisors = '';
    $.each(thesis['Advised'], function(i, a) {
        if (i>0) {
            advisors+= ', ';
        }
        advisors+=a['full_name'] + '(' + a['organization'] + ')';
    });

    var newThesis = $('<div/>',{id: id}).addClass("panel").appendTo(parent);

    if (thesis['approved']) {
        newThesis.addClass("panel-default").addClass('.margin-bottom-40');
    } else {
        newThesis.addClass("panel-warning").addClass('.margin-bottom-40');
    }

    var header = $('<div>').addClass("panel-heading").append(
        $("<div>").addClass("panel-title").append(
            $('<p>').append("<strong>" +  thesis['title'] + "</strong>")
        ).append(
            $('<p>').append("<i>by " + thesis['User'].full_name + "</i>")
        )
    ).appendTo(newThesis);

    if (thesis['nda'] == true) {
        var nda_alert = $('<div class="alert alert-warning" role="alert">');
        nda_alert.append("<span class=\"glyphicon glyphicon-alert\" aria-hidden=\"true\"></span>");
        nda_alert.append("<strong><i>This thesis is under NDA. Members of the committee agreed to signs such NDA.</i></strong>");
        header.append(nda_alert);
    }

    header.append("<button class='add_thesis_slot' data-id='" + thesis['id'] + "'>Assign to Slot</button>" );

    if (!thesis['approved']) {
        header.append($('<p>').append("<strong><i>Requires teacher approval</i></strong>"))
    }

    var body = $('<div>').addClass("panel-body").append(
        $("<div>").addClass("panel-title").append(
            $('<p>').append("<strong>Abstract:</strong>")
        ).append(
            $('<p>').append(thesis['abstract'])
        )
    ).append(
        $("<div>").addClass("panel-title").append(
            $('<p>').append("<strong>Keywords:</strong>")
        ).append(
            $('<p>').append("<i>" + thesis['keywords'] + "</i>")
        )
    ).append(
        $("<div>").addClass("panel-title").append(
            $('<p>').append("<strong>Advisor/s:</strong>")
        ).append(
            $('<p>').append("<i>" + advisors + "</i>")
        )
    ).appendTo(newThesis);

    var footer = $('<div>').addClass("panel-footer").appendTo(newThesis);

    if(!thesis['approved']) {
        var footer_btn = $('<div>').addClass('button-group').appendTo(footer);

        if ((current_user.teacher || current_user.admin)) {
            $('<button>').addClass('btn').addClass('btn-info').addClass('approve-thesis').append("Approve").appendTo(footer_btn);
        }
    }

    newThesis.addClass('unassigned-thesis');
    newThesis.draggable({ revert: true, helper: "clone", disabled: true });
    $('.add_thesis_slot').on('click', function(e) {
        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            alert("No slot selected");
            return false;
        }
        if (selectedNodes[0].type == 'slot') {
            var thesisID = e.target.dataset['id'];
            var slotId = selectedNodes[0].data_object.id;

            $.post( "/admin/thesis/" + thesisID + "/assign", {slot_id: slotId}, 'json').done(function( result ) {
                if(result) {
                    showTree(selectedNodes[0]);
                    showUnassignedTheses();
                    $('.add_thesis_slot').prop("disabled", false);
                }
            });
        }
    });
}

function showUnassignedTheses() {
    $('#panel_unassignedTheses').empty();

    $.get( "/admin/thesis/unassigned", 'json').done(function( data ) {
        $.each(data, function (i, t) {
            addThesis(t, $('#panel_unassignedTheses'));
        });
        $('.add_thesis_slot').prop("disabled",true);
    });

    //$('#panel_unassignedTheses').paginate({pagerSelector:'#thesisPagination',childSelector:'.panel',showPrevNext:true,hidePageNumbers:false,perPage:4});
}

jQuery(document).ready(function() {

    $('#btnRefresh').on('click', function(e) {
        showTree();
        showUnassignedTheses();
    });

    $('#btnFixOrder').on('click', function(e) {
        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            return;
        }

        $.post('/admin/slot/' + selectedNodes[0].data_object.id + '/reorder', {}, 'json')
            .done(function (data) {
                var slotNode = $('#slots_tree').treeview('getParent', selectedNodes[0]);
                showTree();
                showUnassignedTheses();
            });
    });

    $('#btnAddElement').on('click', function(e) {
        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            return;
        }

        $('#btnAddElement').addClass('disabled');
        $('#btnEditElement').addClass('disabled');
        $('#btnDelElement').addClass('disabled');

        $('#btnThesisUp').addClass('disabled');
        $('#btnThesisDown').addClass('disabled');
        $('#btnThesisRemove').addClass('disabled');

        $('#btnFixOrder').addClass('disabled');

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
                $('#slot_room').val(row.room);
                $('#slot_capacity').val(row.capacity);
                $('#slot_date').setFormatedDate(row.start);
                $('#slot_start_time').setFormatedTime(row.start);
                $('#slot_end_time').setFormatedTime(row.end);
                $('#slot_duration').val(row.duration);



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


    $('#btnThesisUp').on('click', function(e) {
        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            return;
        }

        $.post('/admin/thesis/' + selectedNodes[0].data_object.id + '/up', {}, 'json')
            .done(function (data) {
                var slotNode = $('#slots_tree').treeview('getParent', selectedNodes[0]);
                if(slotNode) {
                    var index = -1;
                    $.each(slotNode.nodes, function(i,n) {
                        if (n.nodeId == selectedNodes[0].nodeId) {
                            index = i;
                        }
                    });
                    if(index!=-1) {
                        var aux = slotNode.nodes[index];
                        slotNode.nodes[index] = slotNode.nodes[index-1];
                        slotNode.nodes[index-1] = aux;
                        $('#slots_tree').treeview('expandNode', slotNode);
                    }
                    if(index==1) {
                        $('#btnThesisUp').addClass('disabled');
                    }
                    $('#btnThesisDown').removeClass('disabled');
                }
            });
    });

    $('#btnThesisDown').on('click', function(e) {
        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            return;
        }
        $.post('/admin/thesis/' + selectedNodes[0].data_object.id + '/down', {}, 'json')
            .done(function (data) {
                var slotNode = $('#slots_tree').treeview('getParent', selectedNodes[0]);
                if(slotNode) {
                    var index = -1;
                    $.each(slotNode.nodes, function(i,n) {
                        if (n.nodeId == selectedNodes[0].nodeId) {
                            index = i;
                        }
                    });
                    if(index!=-1) {
                        var aux = slotNode.nodes[index];
                        slotNode.nodes[index] = slotNode.nodes[index+1];
                        slotNode.nodes[index+1] = aux;
                        $('#slots_tree').treeview('expandNode', slotNode);
                    }
                    if(index==slotNode.nodes.length-2) {
                        $('#btnThesisDown').addClass('disabled');
                    }
                    $('#btnThesisUp').removeClass('disabled');
                }
            });
    });

    $('#btnThesisRemove').on('click', function(e) {
        var selectedNodes = $('#slots_tree').treeview('getSelected');
        if (selectedNodes.length == 0) {
            return;
        }
        $.post('/admin/thesis/' + selectedNodes[0].data_object.id + '/unassign', {}, 'json')
            .done(function (data) {
                if(data) {
                    showTree();
                    showUnassignedTheses();
                }
            });
    });
});