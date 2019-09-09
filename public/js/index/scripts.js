function numAdvisedTheses(value, row) {
    return row.Advisor.length;
}
function numCommittees(value, row) {
    return row.Committee.length;
}

function institutionFormatter(value, row, index) {
    if (row.Institution) {
        return row.Institution.acronym;
    } else {
        return '-';
    }
}

function numInstitutionCommittees(value, row) {
    var total = 0;

    for(var i = 0; i < row.Users.length; i++) {
        total += row.Users[i].Committee.length;
    }
    return total;
}

jQuery(document).ready(function() {
    $('#agenda').agenda({source: '/calendar'});
    $('#index_periodsTable').on('check.bs.table', function (e, row, $element) {
        $('#index_statsAdvisedTable').bootstrapTable('refresh',{url: '/stats/' + row.id + '/advised'});
        $('#index_statsCommitteesTable').bootstrapTable('refresh',{url: '/stats/' + row.id + '/committees'});
    });
});
