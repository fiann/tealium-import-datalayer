/** 
 * Populate the data layer from variables in the page. 
 *
 * This extension maps one or more data sources from JavaScript in the page,
 * so that you can have an order of preference. 
 *
 * Configure the capturing in priority order. For example, if you
 * have W3C format data on the page, and you want to fall back
 * to using SiteCatalyst data, you can use this syntax:
 *
 * window.utag_extn.capture_datalayer.config = {
 *   page_name: ["digitalData.page.pageInfo.pageId", "VF.pageName", "s.pageName"]
     product_name: ["digitalData.cart.items[].productname"]

 *   // .. more fields ..
 * };
 *
 */


// below are some standard w3c object names that might be useful to import into your data layer tab. this list can be added to over time.
 /*
product_name,UDO Variable,imported from w3c data layer
product_id,UDO Variable,imported from w3c data layer
product_quantity,UDO Variable,imported from w3c data layer
product_category,UDO Variable,imported from w3c data layer
product_category_id,UDO Variable,imported from w3c data layer
product_color,UDO Variable,imported from w3c data layer
product_manufacturer,UDO Variable,imported from w3c data layer
product_size,UDO Variable,imported from w3c data layer
product_sku,UDO Variable,imported from w3c data layer
product_availability,UDO Variable,imported from w3c data layer
product_subcategory_1,UDO Variable,imported from w3c data layer
product_subcategory_2,UDO Variable,imported from w3c data layer
product_unit_price,UDO Variable,imported from w3c data layer
product_unit_price_wo_tax,UDO Variable,imported from w3c data layer
product_unit_sale_price,UDO Variable,imported from w3c data layer
order_total,UDO Variable,imported from w3c data layer
order_subtotal,UDO Variable,imported from w3c data layer
order_tax,UDO Variable,imported from w3c data layer
subtotal_includes_tax,UDO Variable,imported from w3c data layer
order_currency_code,UDO Variable,imported from w3c data layer
cart_id,UDO Variable,imported from w3c data layer
order_id,UDO Variable,imported from w3c data layer
order_payment_type,UDO Variable,imported from w3c data layer
order_returning_customer,UDO Variable,imported from w3c data layer
order_shipping_cost,UDO Variable,imported from w3c data layer
order_shipping_method,UDO Variable,imported from w3c data layer
page_breadcrumb,UDO Variable,imported from w3c data layer
page_language,UDO Variable,imported from w3c data layer
number_pages_viewed,UDO Variable,imported from w3c data layer
page_category,UDO Variable,imported from w3c data layer
page_name,UDO Variable,imported from w3c data layer
page_url,UDO Variable,imported from w3c data layer
site_countrycode,UDO Variable,imported from w3c data layer
site_countryname,UDO Variable,imported from w3c data layer
visit_date,UDO Variable,imported from w3c data layer
visit_length,UDO Variable,imported from w3c data layer
utag_version,UDO Variable,imported from w3c data layer
utag_path,UDO Variable,imported from w3c data layer
search_results,UDO Variable,imported from w3c data layer
customer_customer_type,UDO Variable,imported from w3c data layer
customer_logged_in,UDO Variable,imported from w3c data layer
customer_country_code,UDO Variable,imported from w3c data layer
customer_country_name,UDO Variable,imported from w3c data layer
customer_email,UDO Variable,imported from w3c data layer
customer_gender,UDO Variable,imported from w3c data layer
customer_id,UDO Variable,imported from w3c data layer
customer_city,UDO Variable,imported from w3c data layer
customer_country,UDO Variable,imported from w3c data layer
customer_first_name,UDO Variable,imported from w3c data layer
customer_last_name,UDO Variable,imported from w3c data layer
customer_postcode,UDO Variable,imported from w3c data layer
*/

/* global utag */
(function() {
  "use strict";

  /**
   * Turn a dotted JS object reference string into a value.
   * @param key the variable name, e.g. "s.pageName"
   * @return the value of the variable if it exists, or null otherwise
   */

  function get_value(key, base) {
    if (toType(key) !== "string" || key === "") {
      return null;
    }
    var part = "",
      parts = key.split("."),
      reference = base ? base : window;
    while (part = parts.shift()) {
      // if reference is undefined, then don't go any further - return null instead
      if (!reference) {
        return null;
      }
      // for arrays, return an array of items, each of which is appropriate
      // child of the object in the array
      if (/\[\]$/.test(part)) {
        part = part.replace(/\[\]$/, "");
        reference = reference[part];
        if (toType(reference) === "array") {
          var array = [];
          for (var j = 0; j < reference.length; j++) {
            if (parts.length > 0) {
              key = parts.join(".");
              array.push("" + get_value(key, reference[j]) || "");
            } else if (toType(reference) === "string") {
              array.push("" + reference[j]);
            }
          }
          // don't go any deeper
          return array;
          // this case allows you to force a string value to become an array, just by using the [] notation in the config object
          // e.g. if utag_data.product.product_id is a string rather than an array on the product page, you can cast it to
          // an array by using utag_data.product.product_id[]
        } else if (toType(reference) === "string") {
          // convert value to array
          return [reference];
        } else {
          return null;
        }
      } else if (reference[part]) {
        // anything that is not an array, just dig into object tree
        reference = reference[part];
      } else {
        return null;
      }
    }
    return reference;
  }

  // http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/

  function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  }

  // expose it in the window.utag_extn.capture_datalayer namespace
  window.utag_extn = window.utag_extn || {};
  window.utag_extn.capture_datalayer = {};
  window.utag_extn.capture_datalayer.process = function process(config, data) {
    if (toType(config) !== "object") {
      // utag.db("window.utag_extn.capture_datalayer: no configuration");
      return {};
    }
    data = data || {};
    for (var data_layer_key in config) {
      // do not overwrite existing data layer values if they are already set
      if (data[data_layer_key]) {
        continue;
      }
      var lookup_keys = config[data_layer_key];
      // if the lookup location is a single key, make it an array
      if (toType(lookup_keys) === "string") {
        lookup_keys = [lookup_keys];
      }
      // if it is not an array of strings, we can't process it
      if (toType(lookup_keys) !== "array") {
        continue;
      }
      // loop through the list of keys
      for (var i = 0; i < lookup_keys.length; i++) {
        var lookup_key = lookup_keys[i];
        var lookup_value = get_value(lookup_key);
        if (lookup_value) {
          data[data_layer_key] = lookup_value;
        }
      }
    }
    return data;
  };

  // the configuration should be in window.utag_extn.capture_datalayer.config
  var configuration = window.utag_extn.capture_datalayer.config,
    b;
  if (toType(b) === "object") {
    b = window.utag_extn.capture_datalayer.process(configuration, b);
  }

})();