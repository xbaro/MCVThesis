jQuery(document).ready(function() {

    /******************************
     * Period Table
     ******************************/
    // When a period is selected, activate the buttons
    $('#periodsTable').on('check.bs.table', function (e, row, $element) {
        // Activate the buttons
        $('#btnEditPeriod').removeClass('disabled');
        $('#btnDelPeriod').removeClass('disabled');
        $('#slots_panel').show();
        showTree();
        showUnassignedTheses();
    });

    // When data is loaded check if there is only one active period and select it
    $('#periodsTable').on('load-success.bs.table', function (e, data) {
        var active = -1;
        var open = -1;
        $.each(data, function(i,p) {
            if (!p.closed && open<0) {
                open = i;
            }
            if (p.active && active<0) {
                active = i;
            }
        });

        if(active>=0) {
             $('#periodsTable').bootstrapTable('check', active);
        } else if (open>=0) {
            $('#periodsTable').bootstrapTable('check', open);
        }
    });



    /*******************************
     * Toolbar actions
     *******************************/
    // Create a period
    $('#btnAddPeriod').on('click', function(e) {
        // Disable the buttons
        $('#btnEditPeriod').addClass('disabled');
        $('#btnDelPeriod').addClass('disabled');
        $('#slots_panel').hide();

        // Reset the form data
        $('#periodFormModal').find('form').trigger("reset");

        // Adapt the form for creation
        $('#periodFormModal').find('.modal-title').text('Add new period');
        $('#periodFormModal').find('.btn-primary').text('Add');
        $('#periodFormModal').find('.btn-primary').data('action', 'add');

        // Remove selection on table
        $('#periodsTable').bootstrapTable('uncheckAll');

        // Show the window
        $('#periodFormModal').modal('show', $('#btnAddPeriod'));
    });

    // Edit a period
    $('#btnEditPeriod').on('click', function(e) {
        // Adapt the form for update
        $('#periodFormModal').find('.modal-title').text('Edit period');
        $('#periodFormModal').find('.btn-primary').text('Update');
        $('#periodFormModal').find('.btn-primary').data('action', 'edit');

        var selectedPeriods = $('#periodsTable').bootstrapTable('getSelections');
        if (selectedPeriods.length>0) {
            var row = selectedPeriods[0];
            $('#period_id').val(row.id);
            $('#period_title').val(row.title);
            $('#period_start').setFormatedDate(row.start);
            $('#period_end').setFormatedDate(row.end);
        }

        // Show the window
        $('#periodFormModal').modal('show', $('#btnEditPeriod'));
    });

    // Delete a period
    $('#btnDelPeriod').on('click', function(e) {

        var selectedPeriods = $('#periodsTable').bootstrapTable('getSelections');
        if (selectedPeriods.length>0) {
            var row = selectedPeriods[0];
            bootbox.confirm("You will remove the period <strong>" + row.title + "</strong> and all the related information.",
                function (result) {
                    if (result) {
                        $.post("/admin/period/delete", {id: row.id}, 'json')
                            .done(function (data) {
                                if(data.hasOwnProperty('error') && !data.error) {
                                    // Deactivate the buttons
                                    $('#btnEditUser').addClass('disabled');
                                    $('#btnDelUser').addClass('disabled');
                                    $('#slots_panel').hide();

                                    // Reload the table data
                                    $('#periodsTable').bootstrapTable('refresh');

                                    // Remove selection on table
                                    $('#periodsTable').bootstrapTable('uncheckAll');

                                    $.notify({
                                        title: '<strong>Period removed</strong>',
                                        message: 'Period <strong>' + row.title + '</strong> has been removed].',
                                        newest_on_top: true
                                    }, {
                                        type: 'success',
                                        element: '#userForm_messages',
                                        'placement.from': 'bottom'
                                    });
                                } else {
                                    $.notify({
                                        title: '<strong>Error</strong>',
                                        message: 'Unexpected error processing the request [action=delete, period=' + row.title + '].',
                                        newest_on_top: true
                                    },{
                                        type: 'danger',
                                        element: '#userForm_messages',
                                        'placement.from': 'bottom'
                                    });
                                }
                            }).fail(function() {
                                $.notify({
                                    title: '<strong>Error</strong>',
                                    message: 'Unexpected error processing the request [action=delete, period=' + row.title + '].',
                                    newest_on_top: true
                                },{
                                    type: 'danger',
                                    element: '#userForm_messages',
                                    'placement.from': 'bottom'
                                });
                        });
                    }
                });
        }
    });

    $('#btnAcceptPeriod').on('click', function(e) {
        var action = $(this).data('action');

        // Get the data from the form
        var period = $('#periodFormModal').find('form').serializeFormJSON();

        // Process special fields

        if (!period.start) {
            period.start = null;
        }
        if (!period.end) {
            period.end = null;
        }

        // Set the action
        var post_action = '';
        var msg_title = 'Error';
        var msg_body = '';
        switch (action) {
            case 'add':
                post_action = '/admin/period/new';
                msg_title = 'Add new period';
                msg_body = 'Created period <strong>' + period.title + '</strong>';
                break;
            case 'edit':
                post_action = '/admin/period/update';
                msg_title = 'Update period';
                msg_body = 'Period <strong>' + period.title + '</strong> successfully updated'
                break;
        }

        // Perform the action
        $.post(post_action, period, 'json')
            .done(function( data ) {
                // Deactivate the buttons
                $('#btnEditPeriod').addClass('disabled');
                $('#btnDelPeriod').addClass('disabled');
                $('#slots_panel').hide();

                // Reload the table data
                $('#periodsTable').bootstrapTable('refresh');

                // Remove selection on table
                $('#periodsTable').bootstrapTable('uncheckAll');

                // Show the message
                if(!data.error) {
                    $.notify({
                        title: '<strong>' + msg_title +'</strong>',
                        message: msg_body,
                        newest_on_top: true
                    }, {
                        type: 'success',
                        element: '#periodForm_messages'
                    });
                    // Close the modal form
                    $('#periodFormModal').modal('hide');
                } else {
                    $.notify({
                        title: '<strong>Error</strong>',
                        message: 'Unexpected error processing the request [action='+ action + ', msg=' + data.message + '].',
                        newest_on_top: true
                    },{
                        type: 'danger',
                        element: '#period_modalBody'
                    });
                }

        }).fail(function() {
            $.notify({
                title: '<strong>Error</strong>',
                message: 'Unexpected error processing the request [action='+ action + ', period=' + period.title + '].',
                newest_on_top: true
            },{
                type: 'danger',
                element: '#period_modalBody'
            });
        });

    });

});