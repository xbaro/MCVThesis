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
     * Users Table
     ******************************/
    // When a user is selected, activate the buttons
    $('#usersTable').on('check.bs.table', function (e, row, $element) {
        // Activate the buttons
        $('#btnEditUser').removeClass('disabled');
        $('#btnDelUser').removeClass('disabled');
    });

    /*******************************
     * Toolbar actions
     *******************************/
    // Create a user
    $('#btnAddUser').on('click', function(e) {
        // Disable the buttons
        $('#btnEditUser').addClass('disabled');
        $('#btnDelUser').addClass('disabled');

        // Reset the form data
        $('#userFormModal').find('form').trigger("reset");

        // Ensure that username is enabled for edit
        $('#user_username').attr('readonly', false);

        // Adapt the form for creation
        $('#userFormModal').find('.modal-title').text('Add new user');
        $('#userFormModal').find('.btn-primary').text('Add');
        $('#userFormModal').find('.btn-primary').data('action', 'add');
        $('#user_passwordHelpBlock').show();

        // Remove selection on table
        $('#usersTable').bootstrapTable('uncheckAll');

        // Show the window
        $('#userFormModal').modal('show', $('#btnAddUser'));
    });

    // Edit a user
    $('#btnEditUser').on('click', function(e) {
        // Ensure that username is read-only
        $('#user_username').attr('readonly', true);

        // Adapt the form for update
        $('#userFormModal').find('.modal-title').text('Edit user data');
        $('#userFormModal').find('.btn-primary').text('Update');
        $('#userFormModal').find('.btn-primary').data('action', 'edit');
        $('#user_passwordHelpBlock').hide();

        var selectedUsers = $('#usersTable').bootstrapTable('getSelections');
        if (selectedUsers.length>0) {
            var row = selectedUsers[0];
            $('#user_username').val(row.username);
            $('#user_name').val(row.name);
            $('#user_surname').val(row.surname);
            $('#user_email').val(row.email);
            $('#user_organization').val(row.organization);
            $('#user_roles').val(row.roles);
            $('#user_keywords').val(row.keywords);
        }

        // Show the window
        $('#userFormModal').modal('show', $('#btnEditUser'));
    });

    // Delete a user
    $('#btnDelUser').on('click', function(e) {

        var selectedUsers = $('#usersTable').bootstrapTable('getSelections');
        if (selectedUsers.length>0) {
            var row = selectedUsers[0];
            bootbox.confirm("You will remove the user <strong>" + row.username + "</strong> and all the related information.",
                function (result) {
                    if (result) {
                        $.post("/admin/user/delete", {username: row.username}, 'json')
                            .done(function (data) {
                                // Deactivate the buttons
                                $('#btnEditUser').addClass('disabled');
                                $('#btnDelUser').addClass('disabled');

                                // Reload the table data
                                $('#usersTable').bootstrapTable('refresh');

                                // Remove selection on table
                                $('#usersTable').bootstrapTable('uncheckAll');

                                $.notify({
                                    title: '<strong>User removed</strong>',
                                    message: 'User <strong>' + row.username + '</strong> has been removed].',
                                    newest_on_top: true
                                },{
                                    type: 'success',
                                    element: '#userForm_messages',
                                    'placement.from': 'bottom'
                                });
                            }).fail(function() {
                                $.notify({
                                    title: '<strong>Error</strong>',
                                    message: 'Unexpected error processing the request [action=delete, user=' + row.username + '].',
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

    $('#btnAcceptUser').on('click', function(e) {
        var action = $(this).data('action');

        // Get the data from the form
        var user = $('#userFormModal').find('form').serializeFormJSON();

        // Process special fields

        // Keywords
        var keywords = '';
        if (user.keywords instanceof Array) {
            $.each(user.keywords, function(i,k){
                keywords += k;
            })
        } else {
            keywords = user.keywords;
        }
        user.keywords = keywords;

        // Password
        if ($('#user_change_psw').is(":checked")) {
            user.change_password = true;
            user.password = $('#user_password').val();
        } else {
            user.change_password = false;
            user.password = 'mcv2016';
        }

        // Set the action
        var post_action = '';
        var msg_title = 'Error';
        var msg_body = '';
        switch (action) {
            case 'add':
                post_action = '/admin/user/new';
                msg_title = 'Add new user';
                msg_body = 'Created user <strong>' + user.username + '</strong>';
                break;
            case 'edit':
                post_action = '/admin/user/update';
                msg_title = 'Update user';
                msg_body = 'User <strong>' + user.username + '</strong> successfully updated'
                break;
        }

        // Perform the action
        $.post(post_action, user, 'json')
            .done(function( data ) {
                // Deactivate the buttons
                $('#btnEditUser').addClass('disabled');
                $('#btnDelUser').addClass('disabled');

                // Reload the table data
                $('#usersTable').bootstrapTable('refresh');

                // Remove selection on table
                $('#usersTable').bootstrapTable('uncheckAll');

                // Show the message
                if(data.hasOwnProperty('error') && !data.error) {
                    $.notify({
                        title: '<strong>' + msg_title +'</strong>',
                        message: msg_body,
                        newest_on_top: true
                    }, {
                        type: 'success',
                        element: '#userForm_messages'
                    });
                    // Close the modal form
                    $('#userFormModal').modal('hide');
                } else {
                    $.notify({
                        title: '<strong>Error</strong>',
                        message: 'Unexpected error processing the request [action='+ action + ', msg=' + data.message + '].',
                        newest_on_top: true
                    },{
                        type: 'danger',
                        element: '#user_modalBody'
                    });
                }

        }).fail(function() {
            $.notify({
                title: '<strong>Error</strong>',
                message: 'Unexpected error processing the request [action='+ action + ', user=' + user.username + '].',
                newest_on_top: true
            },{
                type: 'danger',
                element: '#user_modalBody'
            });
        });

    });

    // Enable password change
    $('#user_change_psw').change( function(event) {
        if ($(this).is(":checked")) {
            $('#user_password').attr('disabled', false);
        } else {
            $('#user_password').attr('disabled', true);
        }
    });


    /*******************************
     * Roles management
     *******************************/
    //$('#user_roles').combobox();

    var roles = ['admin','teacher'];

    $('#userFormModal').on('shown.bs.modal', function () {


    });




});