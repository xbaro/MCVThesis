function numAdvisedTheses(value, row) {
    return row.Advisor.length;
}
function numCommittes(value, row) {
    return row.Committee.length;
}

jQuery(document).ready(function() {
    $('#agenda').agenda({source: '/calendar'});
    $('#index_periodsTable').on('check.bs.table', function (e, row, $element) {
        $('#index_statsTable').bootstrapTable('refresh',{url: '/stats/' + row.id});
    });
});
