function showAlarmData(id, title, text, data, columns) {

    var code = '<a href="#' + id + '" class="btn btn-info btn-xs" data-toggle="collapse"><i class="glyphicon glyphicon-plus"></i></a> <strong>' + title + '</strong>' +
                    '<p><em>' + text + '</em></p>' +
                    '<div id="' + id + '" class="collapse">' +
                        '<table id="'+ 'table_' + id + '">' +
                        '</table>' +
                    '</div>';

    $('#warnings').append(code);

    $('#table_' + id).bootstrapTable({
        url: data,
        columns: columns,
        pagination: true,
        search: true,
        pageSize: 5,
        pageList: [5, 10, 20]
    });
}

function getAdvisorList(value, row, index) {
    var retList = '';
    for(var i = 0; i<value.length; i++) {
        if(i>0) {
            retList+=', ';
        }
        retList += value[i].full_name + ' (' + value[i].organization + ')';
    }
    return retList;
}

jQuery(document).ready(function() {

    $.get('/admin/alerts/noslot', {}, 'json').done(function(data) {
        if(data && data instanceof Array && data.length>0) {
            $('#no_warnings').hide();
            showAlarmData('no_slot_thesis', 'Theses without slot', 'Found ' + data.length + ' theses that are not assigned to any defense slot.', '/admin/alerts/noslot',
                [{field: 'id', title: 'id', sortable: true},
                 {field: 'User.full_name', title: 'Author', sortable: true},
                 {field: 'title', title: 'Title', sortable: true},
                 {field: 'abstract', title: 'Abstract', sortable: true},
                 {field: 'Advised', title: 'Advisors', sortable: true, formatter: getAdvisorList},
                ]);
        }
    });
    $.get('/admin/alerts/noadvisor', {}, 'json').done(function(data) {
        if(data && data instanceof Array && data.length>0) {
            $('#no_warnings').hide();
            showAlarmData('no_advisor_thesis', 'Theses without advisors', 'Found ' + data.length + ' theses that are not assigned to any advisor.', '/admin/alerts/noadvisor',
                [{field: 'id', title: 'id', sortable: true},
                 {field: 'User.full_name', title: 'Author', sortable: true},
                 {field: 'title', title: 'Title', sortable: true},
                 {field: 'abstract', title: 'Abstract', sortable: true}

                ]);
        }
    });
    $.get('/admin/alerts/noauthor', {}, 'json').done(function(data) {
        if(data && data instanceof Array && data.length>0) {
            $('#no_warnings').hide();
            showAlarmData('no_author_thesis', 'Theses without author', 'Found ' + data.length + ' theses that are not assigned to any student.', '/admin/alerts/noauthor',
                [{field: 'id', title: 'id', sortable: true},
                 {field: 'title', title: 'Title', sortable: true},
                 {field: 'abstract', title: 'Abstract', sortable: true},
                 {field: 'Advised', title: 'Advisors', sortable: true, formatter: getAdvisorList}
                ]);
        }
    });
    $.get('/admin/alerts/notapproved', {}, 'json').done(function(data) {
        if(data && data instanceof Array && data.length>0) {
            $('#no_warnings').hide();
            showAlarmData('no_approved_thesis', 'Theses that require to be approved', 'Found ' + data.length + ' theses that are not yest approved.', '/admin/alerts/notapproved',
                [{field: 'id', title: 'id', sortable: true},
                 {field: 'User.full_name', title: 'Author', sortable: true},
                 {field: 'title', title: 'Title', sortable: true},
                 {field: 'abstract', title: 'Abstract', sortable: true},
                 {field: 'Advised', title: 'Advisors', sortable: true, formatter: getAdvisorList}
                ]);
        }
    });
    $.get('/admin/alerts/nocommittee', {}, 'json').done(function(data) {
        if(data && data instanceof Array && data.length>0) {
            $('#no_warnings').hide();
            showAlarmData('no_committee_thesis', 'Theses that requires committee assigment', 'Found ' + data.length + ' theses that require committee members.', '/admin/alerts/nocommittee',
                [{field: 'id', title: 'id', sortable: true},
                 {field: 'User.full_name', title: 'Author', sortable: true},
                 {field: 'title', title: 'Title', sortable: true},
                 {field: 'abstract', title: 'Abstract', sortable: true},
                 {field: 'Advised', title: 'Advisors', sortable: true, formatter: getAdvisorList}
                ]);
        }
    });
});
