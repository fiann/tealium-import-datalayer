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


(function() {
  "use strict";

  // expose it in the window.utag_extn.capture_datalayer namespace
  window.utag_extn = window.utag_extn || {};
  var utag_extn = window.utag_extn;


  /**
   * Turn a dotted JS object reference string into a value.
   * @param key the variable name, e.g. "s.pageName"
   * @return the value of the variable if it exists, or empty string otherwise
   */

  function get_value(key, base) {
    if (toType(key) !== "string" || key === "") {
      return null;
    }
    var part = "",
      parts = key.split("."),
      reference = base ? base : window;
    while ((part = parts.shift()) !== undefined) {
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
              array.push("" + (get_value(key, reference[j]) || ""));
            } else {
              array.push("" + (reference[j] || ""));
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
  utag_extn.capture_datalayer = {};
  utag_extn.capture_datalayer.process = function process(config, data) {
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
  var config = utag_extn.capture_datalayer.config, b;
  if (config && toType(b) === "object") {
    b = utag_extn.capture_datalayer.process(config, b);
  }

})();