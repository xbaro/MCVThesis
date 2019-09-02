jQuery(document).ready(function() {

    /*******************************
     * Util functions
     *******************************/

    // Serrialize a form to a JSON object
    $.fn.serializeFormJSON = function () {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    /******************************
     * Institutions Table
     ******************************/
    // When an institution is selected, activate the buttons
    $('#institutionTable').on('check.bs.table', function (e, row, $element) {
        // Activate the buttons
        $('#btnEditInstitution').removeClass('disabled');
        $('#btnDelInstitution').removeClass('disabled');
    });


    /*******************************
     * Toolbar actions
     *******************************/
    // Create an institution
    $('#btnAddInstitution').on('click', function(e) {
        // Disable the buttons
        $('#btnEditInstitution').addClass('disabled');
        $('#btnDelInstitution').addClass('disabled');

        // Reset the form data
        $('#institutionFormModal').find('form').trigger("reset");

        // Adapt the form for creation
        $('#institutionFormModal').find('.modal-title').text('Add new institution');
        $('#institutionFormModal').find('.btn-primary').text('Add');
        $('#institutionFormModal').find('.btn-primary').data('action', 'add');

        // Remove selection on table
        $('#institutionTable').bootstrapTable('uncheckAll');

        // Show the window
        $('#institutionFormModal').modal('show', $('#btnAddInstitution'));
    });

    // Edit an institution
    $('#btnEditInstitution').on('click', function(e) {
        // Adapt the form for update
        $('#institutionFormModal').find('.modal-title').text('Edit institution data');
        $('#institutionFormModal').find('.btn-primary').text('Update');
        $('#institutionFormModal').find('.btn-primary').data('action', 'edit');

        var selectedInstitutions = $('#institutionTable').bootstrapTable('getSelections');
        if (selectedInstitutions.length>0) {
            var row = selectedInstitutions[0];
            $('#institution_id').val(row.id);
            $('#institution_acronym').val(row.acronym);
            $('#institution_name').val(row.name);
        }

        // Show the window
        $('#institutionFormModal').modal('show', $('#btnEditInstitution'));
    });

    // Delete an institution
    $('#btnDelInstitution').on('click', function(e) {

        var selectedInstitutions = $('#institutionTable').bootstrapTable('getSelections');
        if (selectedInstitutions.length>0) {
            var row = selectedInstitutions[0];
            bootbox.confirm("You will remove the institution <strong>" + row.acronym + "</strong> and all the related information.",
                function (result) {
                    if (result) {
                        $.post("/admin/institution/delete", {id: row.id}, 'json')
                            .done(function (data) {
                                // Deactivate the buttons
                                $('#btnEditInstitution').addClass('disabled');
                                $('#btnDelInstitution').addClass('disabled');

                                // Reload the table data
                                $('#institutionTable').bootstrapTable('refresh');

                                // Remove selection on table
                                $('#institutionTable').bootstrapTable('uncheckAll');

                                $.notify({
                                    title: '<strong>Institution removed</strong>',
                                    message: 'Institution <strong>' + row.acronym + '</strong> has been removed].',
                                    newest_on_top: true
                                },{
                                    type: 'success',
                                    element: '#institutionForm_messages',
                                    'placement.from': 'bottom'
                                });
                            }).fail(function() {
                                $.notify({
                                    title: '<strong>Error</strong>',
                                    message: 'Unexpected error processing the request [action=delete, institution=' + row.acronym + '].',
                                    newest_on_top: true
                                },{
                                    type: 'danger',
                                    element: '#institutionForm_messages',
                                    'placement.from': 'bottom'
                                });
                        });
                    }
                });
        }
    });

    $('#btnAcceptInstitution').on('click', function(e) {
        var action = $(this).data('action');

        // Get the data from the form
        var institution = $('#institutionFormModal').find('form').serializeFormJSON();

        // Set the action
        var post_action = '';
        var msg_title = 'Error';
        var msg_body = '';
        switch (action) {
            case 'add':
                post_action = '/admin/institution/new';
                msg_title = 'Add new institution';
                msg_body = 'Created institution <strong>' + institution.acronym + '</strong>';
                break;
            case 'edit':
                post_action = '/admin/institution/update';
                msg_title = 'Update institution';
                msg_body = 'Institution <strong>' + institution.acronym + '</strong> successfully updated'
                break;
        }

        // Perform the action
        $.post(post_action, institution, 'json')
            .done(function( data ) {
                // Deactivate the buttons
                $('#btnEditInstitution').addClass('disabled');
                $('#btnDelInstitution').addClass('disabled');

                // Reload the table data
                $('#institutionTable').bootstrapTable('refresh');

                // Remove selection on table
                $('#institutionTable').bootstrapTable('uncheckAll');

                // Show the message
                if(data.hasOwnProperty('error') && !data.error) {
                    $.notify({
                        title: '<strong>' + msg_title +'</strong>',
                        message: msg_body,
                        newest_on_top: true
                    }, {
                        type: 'success',
                        element: '#institutionForm_messages'
                    });
                    // Close the modal form
                    $('#institutionFormModal').modal('hide');
                } else {
                    $.notify({
                        title: '<strong>Error</strong>',
                        message: 'Unexpected error processing the request [action='+ action + ', msg=' + data.message + '].',
                        newest_on_top: true
                    },{
                        type: 'danger',
                        element: '#institution_modalBody'
                    });
                }

        }).fail(function() {
            $.notify({
                title: '<strong>Error</strong>',
                message: 'Unexpected error processing the request [action='+ action + ', institution=' + institution.acronym + '].',
                newest_on_top: true
            },{
                type: 'danger',
                element: '#institution_modalBody'
            });
        });

    });
});