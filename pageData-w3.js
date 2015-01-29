// Logic from the omnitureIntegration.js function pageData()


// Set tracker to be the data object rather than the SiteCat 's' object
var tracker = b;

// Collect data fields from the page
if (! tracker.page_name) {
  tracker.page_name = bookname + ":" + vcozaCurrentPageLabel;
}
tracker.channel = bookname;

// Page navigation master tab
var context = "";
if (window.globalPortalContextPath && globalPortalContextPath.length > 1) {
    context = globalPortalContextPath.slice(1);
}
tracker.page_master_tab = context.capitalize();

if (window.location.href.indexOf("omnitureLogin") > -1) {
    tracker.visitor_event = "login";
    //tracker.events = "event6";
}

// build up hierarchy variables
var pageArray = new Array();

// condition is to support overWritePageName() calls
if (tracker.force_page_name) {
    tracker.ajax_page_name = tracker.force_page_name;
} else {
    pageArray.push(bookname);
    $("#subnav li[class*='current']").parentsUntil(".mod2Col").parent().children(".modHeader").children().each(function() {
        pageArray.push(($(this).html() + "").trim());
    });
    $("#subnav li[class*='current']>a").each(function() {
        pageArray.push(($(this).html() + "").trim());
    });
    if ($("a[class='active_tab']>span").length > 0) {
        pageArray.push($("a[class='active_tab']>span").html());
    }
    if (pageArray.length == 1) {
        pageArray.push(vcozaCurrentPageLabel);
    }
}

// Fix data from the logged in area. The menu title was renamed from "My Vodacom"
// to "My Account". We change this back to ensure consistency in the page name
// reports.
if (pageArray[1] === "My Account") {
    pageArray[1] = "My Vodacom";
}

// This is to support updateOmniturePageName() calls, appending to the current page
// name hierarchy.
if (tracker.ajax_page_name) {
    var pages = tracker.ajax_page_name.split(":");
    for (i = 0; i < pages.length; i++) {
        pageArray.push(pages[i]);
    }
}

// Site section hierarchy
// Note: array.slice() doesn't mind of you go over the end of the array
tracker.page_site_section_lvl_2 = pageArray.slice(0, 2).join(":");
tracker.page_site_section_lvl_3 = pageArray.slice(0, 3).join(":");
tracker.page_site_section_lvl_4 = pageArray.slice(0, 4).join(":");
tracker.page_name = pageArray.slice(0, 5).join(":");

// Handle form name calls from formStarted(), formCompleted(), errorOnForm() 
// in omnitureIntegration extension
if (data.short_form_name) {
    data.page_form_name = data.page_name + ":" + data.short_form_name;
    data.short_form_name = "";
}


// Page type variable
digitalData = window.digitalData || {};
digitalData.page = digitalData.page || {};
digitalData.page.pageInfo = digitalData.pageInfo || {};
if (bookname == "myaccount") {
    digitalData.page.pageInfo.pageType = "self service";
} else if (bookname == "phonesandplans") {
    digitalData.page.pageInfo.pageType = "sales";
} else {
    digitalData.page.pageInfo.pageType = "content";
}

// Page name check
if (typeof console != 'undefined' && typeof console.log != 'undefined') {
    if (tracker.page_name.length > 100) {
        console.log("pageName:" + tracker.pageName + " too long");
    }
}
