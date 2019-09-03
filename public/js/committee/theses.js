function addThesis(thesis, parent, locked) {

    var id = 'thesis_' + thesis['id'];
    var advisors = '';
    $.each(thesis['Advised'], function(i, a) {
        if (i>0) {
            advisors+= ', ';
        }
        advisors+=a['full_name'] + ' (' + a['organization'] + ')';
    });

    var newThesis = $('<div/>',{id: id}).addClass("panel").appendTo(parent);

    if (thesis['approved']) {
        newThesis.addClass("panel-default").addClass('.margin-bottom-40');
    } else {
        newThesis.addClass("panel-warning").addClass('.margin-bottom-40');
    }

    var start_t = new Date(new Date(thesis.Slot.start).getTime() + (thesis.order-1)*thesis.Slot.duration*60000);
    var end_t = new Date(start_t.getTime() + thesis.Slot.duration*60000);

    var time_info = '<h4><span class="label label-primary">' + getFormatedTime(start_t) + '-' + getFormatedTime(end_t) + '</span></h4>';

    var header = $('<div>').addClass("panel-heading").append(
        $("<div>").addClass("panel-title").append(
            $('<p>').append(time_info + " <strong>" +  thesis['title'] + "</strong>")
        ).append(
            $('<p>').append("<i>by " + thesis['User'].full_name + "</i>")
        )
    ).appendTo(newThesis);

    if (!thesis['approved']) {
        header.append($('<p>').append("<strong><i>Requires teacher approval</i></strong>"))
    }

    if (thesis['nda'] == true) {
        var nda_alert = $('<div class="alert alert-warning" role="alert">');
        nda_alert.append("<span class=\"glyphicon glyphicon-alert\" aria-hidden=\"true\"></span>");
        nda_alert.append("<strong><i>This thesis is under NDA. Members of the committee agreed to sign such NDA.</i></strong>");
        header.append(nda_alert);
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

    var c_p = [];
    var c_s = [];
    var c_v = [];
    var isAssigned = false;
    $.each(thesis.Reviewed, function(i, cm) {
        if(cm.username===current_user.username) {
            isAssigned = true;
        }
        if (cm.Committee.president) {
            c_p.push(cm);
        }
        if (cm.Committee.secretary) {
            c_s.push(cm);
        }
        if (cm.Committee.vocal) {
            c_v.push(cm);
        }
    });

    if(c_p.length===0) {
        if(isAssigned || locked) {
            var c_p_div = $('<div>');
        } else {
            var c_p_div = $('<div>').append('<button type="button" name="request" class="btn btn-success request_committee" data-thesis="' + thesis.id + '" data-role="president">Request</button>');
        }
        if(current_user.admin) {
            c_p_div.append('<button type="button" name="assign" class="btn btn-info assign_committee" data-thesis="' + thesis.id + '" data-role="president">Assign</button>');
        }
    } else {
        var c_p_div = $('<div>').append("<i>" + c_p[0].full_name + ' (' + c_p[0].organization + ')' + "</i>");

        if(c_p[0].username === current_user.username && locked === false) {
            c_p_div.append(
                    $('<button type="button" name="remove" class="btn btn-danger abandon_committee" data-thesis="' + thesis.id + '" data-role="president" />').append(
                        '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
                )
            );
        } else {
            if(current_user.admin) {
                c_p_div.append(
                        $('<button type="button" name="remove" class="btn btn-danger abandon_committee_admin" data-thesis="' + thesis.id + '" data-role="president" />').append(
                            '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
                    )
                );
            }
        }
    }
    if(c_s.length===0) {
        if(isAssigned || locked) {
            var c_s_div = $('<div>');
        } else {
            var c_s_div = $('<div>').append('<button type="button" name="request" class="btn btn-success request_committee" data-thesis="' + thesis.id + '" data-role="secretary">Request</button>');
        }
        if(current_user.admin) {
            c_s_div.append('<button type="button" name="assign" class="btn btn-info assign_committee" data-thesis="' + thesis.id + '" data-role="secretary">Assign</button>');
        }
    } else {
        var c_s_div = $('<div>').append("<i>" + c_s[0].full_name + ' (' + c_s[0].organization + ')' + "</i>");

        if(c_s[0].username === current_user.username && locked === false) {
            c_s_div.append(
                    $('<button type="button" name="remove" class="btn btn-danger abandon_committee" data-thesis="' + thesis.id + '" data-role="secretary" />').append(
                        '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
                )
            );
        } else {
            if(current_user.admin) {
                c_s_div.append(
                        $('<button type="button" name="remove" class="btn btn-danger abandon_committee_admin" data-thesis="' + thesis.id + '" data-role="secretary" />').append(
                            '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
                    )
                );
            }
        }
    }
    if(c_v.length===0) {
        if(isAssigned || locked) {
            var c_v_div = $('<div>');
        } else {
            var c_v_div = $('<div>').append('<button type="button" name="request" class="btn btn-success request_committee" data-thesis="' + thesis.id + '" data-role="vocal">Request</button>');
        }
        if(current_user.admin) {
            c_v_div.append('<button type="button" name="assign" class="btn btn-info assign_committee" data-thesis="' + thesis.id + '" data-role="vocal">Assign</button>');
        }
    } else {
        var c_v_div = $('<div>').append("<i>" + c_v[0].full_name + ' (' + c_v[0].organization + ')' + "</i>")

        if(c_v[0].username === current_user.username && locked === false) {
            c_v_div.append(
                    $('<button type="button" name="remove" class="btn btn-danger abandon_committee" data-thesis="' + thesis.id + '" data-role="vocal" />').append(
                        '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
                )
            );
        } else {
            if(current_user.admin) {
                c_v_div.append(
                        $('<button type="button" name="remove" class="btn btn-danger abandon_committee_admin" data-thesis="' + thesis.id + '" data-role="vocal" />').append(
                            '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
                    )
                );
            }
        }
    }


    var footer = $('<div>').addClass("panel-footer").append(
        $('<div>').addClass("row").append(
            $('<div>').addClass('col-xs-6 col-sm-4').append(
                '<h4>President:</h4>'
            ).append(
                $('<p>').append(c_p_div)
            )
        ).append(
            $('<div>').addClass('col-xs-6 col-sm-4').append(
                '<h4>Secretary:</h4>'
            ).append(
                $('<p>').append(c_s_div)
            )
        ).append(
            $('<div>').addClass('col-xs-6 col-sm-4').append(
                '<h4>Vocal:</h4>'
            ).append(
                $('<p>').append(c_v_div)
            )
        )
    ).appendTo(newThesis);

}


function get_period_node(node) {
    if (node.type === "period") {
        return node;
    }

    var parent = $('#committee_tree').treeview('getParent', node.nodeId);

    if (parent.nodeId === undefined) {
        return null;
    }

    return get_period_node(parent);
}


function is_locked_period(node) {
    var period_node = get_period_node(node);
    if (period_node !== null && period_node.data_object.locked) {
        return true;
    }
    return false;
}

function showUnassignedTheses(node) {
    $('#panel_Theses').empty();

    var type = node.type;
    var id = node.data_object.id;

    var locked_period = is_locked_period(node);
    if (locked_period) {
        $("#msg_period_locked").show();
    } else {
        $("#msg_period_locked").hide();
    }

    $.get( "/committees/theses/" + type, {id: id}, 'json').done(function( data ) {
        $.each(data, function (i, t) {
            addThesis(t, $('#panel_Theses'), locked_period);
        });
        $(window).scrollTop(lastScrollValue);
        $('.request_committee').on('click', function(event) {
            var thesisId = event.target.dataset.thesis;
            var role = event.target.dataset.role;

            $.post('/committees/theses/assign/' + thesisId + '/' + role, {}, 'json')
                .done(function (data) {
                    showPeriodsTree(node);
                    $('#myCommitteesTable').bootstrapTable('refresh');
                });
        });
        $('.abandon_committee').on('click', function(event) {
            var thesisId = event.target.dataset.thesis;
            $.post('/committees/theses/unassign/' + thesisId, {}, 'json')
                .done(function (data) {
                    showPeriodsTree(node);
                    $('#myCommitteesTable').bootstrapTable('refresh');
                });
        });

        $('.abandon_committee_admin').on('click', function(event) {
            var thesisId = event.target.dataset.thesis;
            var role = event.target.dataset.role;
            $.post('/committees/theses/unassign/' + thesisId, {role: role}, 'json')
                .done(function (data) {
                    showPeriodsTree(node);
                    $('#myCommitteesTable').bootstrapTable('refresh');
                });
        });

        $('.assign_committee').on('click', function(event) {
            var thesisId = event.target.dataset.thesis;
            var role = event.target.dataset.role;

            // Initialize the values
            $( ".teacher-autocomplete" ).val('');
            $("#thesis_id").val(thesisId);
            $("#role").val(role);

            // Show the window
            $('#assignFormModal').modal('show', event.target);
        });

        $( ".teacher-autocomplete" ).autocomplete({
            source: '/committees/teachers',
            minLength: 1,
            select: function(event, ui) {
                // Close the selection menu
                $( ".teacher-autocomplete" ).autocomplete( "close" );

                // Get the data
                var thesisId = $("#thesis_id").val();
                var role = $("#role").val();
                var username = ui.item.username;

                $.post('/committees/theses/assign/' + thesisId + '/' + role, {username: username}, 'json')
                    .done(function (data) {
                        showPeriodsTree(node);
                        // Close the window
                        $('#assignFormModal').modal('hide');
                        $('#myCommitteesTable').bootstrapTable('refresh');
                    });
            }
        });
        $( ".teacher-autocomplete" ).autocomplete( "option", "appendTo", "#assignFormModal" );
        $('#assignFormModal').on('shown.bs.modal', function () {
            $('.teacher-autocomplete').focus();
        });
        $('#assignFormModal').on('show.bs.modal', function () {
            lastScrollValue=$(window).scrollTop();
        });
        $('#assignFormModal').on('hidden.bs.modal', function () {
            $(window).scrollTop(lastScrollValue);
        });
    });
}
