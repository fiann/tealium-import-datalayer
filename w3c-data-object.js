// W3C format example
window.digitalData = {
  pageInstanceID: "Home-Production",
  page: {
    pageInfo: {
      pageID: "home",
      destinationURL: "http://www.vodacom.co.za/personal/main/home"
    },
    category: {
      primaryCategory: "personal",
      subCategory1: "main",
      pageType: "content"
    },
    attributes: {
      market: "ZA"
    }
  },
  user: [{
    attributes: {
      login_status: "logged Out"
    }
  }]
};

// Tealium data layer format example
window.utag_data = window.utag_data || {};
utag_data.page_name = "home";
utag_data.page_channel = "main";
utag_data.visitor_login_status = "logged Out";
// Additional data points set inside Tealium utag.js code
// page_market is set to a fixed value in utag.js
// page_channel is set from window.bookname
// page_master_tab is scraped from window.globalPortalContextPath
// page_type is set by a lookup from window.bookname



// Ecommerce example
digitalData.cart.price = {
  basePrice: 200.00,
  currency: "EUR",
  cartTotal: 125
};


// Event example
digitalData.event[n].eventInfo = {
  eventName: "Form started",
  type: "form",
  eventAction: "started", 
  attributes: {
    form_name: "new customer details"
  }
};

utag_data[ eventInfo.type + "_event" ] = eventInfo.eventAction;
utag_data["visitor_event"] = "login";