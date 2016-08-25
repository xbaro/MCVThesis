/*******************************
* Util functions
*******************************/
function dateFormatter(value, row) {
    if(value) {
        return new Date(value).toLocaleDateString();
    }
    return '';
}

function strCapitalize(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

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

// Get a date value in the allowed format for date inputs
$.fn.getFormatedDate = function () {
    var date = new Date(this.val());

    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);

    return date.getFullYear() + "-" + (month) + "-" + (day);
};

// Assign a date to a date input
$.fn.setFormatedDate = function (date) {
    if(date) {
        var date = new Date(date);

        var day = ("0" + date.getDate()).slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);

        this.val(date.getFullYear() + "-" + (month) + "-" + (day));
    } else {
        this.val('');
    }
};
$.fn.setFormatedTime = function (date) {
    if(date) {
        var date = new Date(date);

        this.val(("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ':' + ("0" + date.getSeconds()).slice(-2));
    } else {
        this.val('');
    }
};



function getFormatedTime(date) {
    return date.getHours() + ":" + ("0" + date.getMinutes()).slice(-2);
}

$.fn.paginate = function(opts){
    var $this = this,
        defaults = {
            perPage: 7,
            showPrevNext: false,
            numbersPerPage: 1,
            hidePageNumbers: false
        },
        settings = $.extend(defaults, opts);

    var listElement = $this;
    var perPage = settings.perPage;
    var children = listElement.children();
    var pager = $('.pagination');

    if (typeof settings.childSelector!="undefined") {
        children = listElement.find(settings.childSelector);
    }

    if (typeof settings.pagerSelector!="undefined") {
        pager = $(settings.pagerSelector);
    }

    var numItems = children.size();
    var numPages = Math.ceil(numItems/perPage);

    var curr = 0;
    pager.data("curr",curr);

    if (settings.showPrevNext){
        $('<li><a href="#" class="prev_link">«</a></li>').appendTo(pager);
    }

    while(numPages > curr && (settings.hidePageNumbers==false)){
        $('<li><a href="#" class="page_link">'+(curr+1)+'</a></li>').appendTo(pager);
        curr++;
    }

    if (settings.numbersPerPage>1) {
       $('.page_link').hide();
       $('.page_link').slice(pager.data("curr"), settings.numbersPerPage).show();
    }

    if (settings.showPrevNext){
        $('<li><a href="#" class="next_link">»</a></li>').appendTo(pager);
    }

    pager.find('.page_link:first').addClass('active');
    pager.find('.prev_link').hide();
    if (numPages<=1) {
        pager.find('.next_link').hide();
    }
  	pager.children().eq(0).addClass("active");

    children.hide();
    children.slice(0, perPage).show();

    pager.find('li .page_link').click(function(){
        var clickedPage = $(this).html().valueOf()-1;
        goTo(clickedPage,perPage);
        return false;
    });
    pager.find('li .prev_link').click(function(){
        previous();
        return false;
    });
    pager.find('li .next_link').click(function(){
        next();
        return false;
    });

    function previous(){
        var goToPage = parseInt(pager.data("curr")) - 1;
        goTo(goToPage);
    }

    function next(){
        goToPage = parseInt(pager.data("curr")) + 1;
        goTo(goToPage);
    }

    function goTo(page){
        var startAt = page * perPage,
            endOn = startAt + perPage;

        children.css('display','none').slice(startAt, endOn).show();

        if (page>=1) {
            pager.find('.prev_link').show();
        }
        else {
            pager.find('.prev_link').hide();
        }

        if (page<(numPages-1)) {
            pager.find('.next_link').show();
        }
        else {
            pager.find('.next_link').hide();
        }

        pager.data("curr",page);

        if (settings.numbersPerPage>1) {
       		$('.page_link').hide();
       		$('.page_link').slice(page, settings.numbersPerPage+page).show();
    	}

      	pager.children().removeClass("active");
        pager.children().eq(page+1).addClass("active");

    }
};