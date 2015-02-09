/**
 * Tests the Capture Datalayer extension.
 * The easiest way to run this is to open capture-datalayer-test.html
 * in a browser.
 */

"use strict";

// Tealium goodies
/*global utag, utag_data */

// Mocha test functionality 
/*global chai, describe, beforeEach, it, expect */

// Make sure namespace exists
window.utag_extn = window.utag_extn || {};
window.utag_extn.import_datalayer = window.utag_extn.import_datalayer || {};
window.utag_extn.import_datalayer.config = window.utag_extn.import_datalayer.config || {};
var config = window.utag_extn.import_datalayer.config;

// Test code
describe("The 'Capture Data Layer' extension", function() {
  beforeEach(function() {
    delete window.utag_data;
  });

  describe("Simple, single variable capture", function() {
    it("captures a global scope variable", function() {
      window.pageName = "pageName:Homepage";
      config = {
        page_name: "pageName"
      };
      var expected_data = {
        page_name: "pageName:Homepage"
      };
      capture_and_validate("pageName", expected_data);
    });
  });

  describe("SiteCatalyst data object", function() {
    it("captures a dotted object variable (s.pageName)", function() {
      // defined in html page
      var s = window.s = {};
      s.pageName = "s.pageName:Homepage";
      // scraping configuration
      config = {
        page_name: "s.pageName"
      };
      var expected_data = {
        page_name: "s.pageName:Homepage"
      };
      capture_and_validate("s", expected_data);
    });
    it("captures props and eVars, and handles missing values", function() {
      // defined in html page
      var s = window.s = {};
      s.pageName = "s.pageName:Homepage";
      s.prop1 = "prop1:Search string";
      s.prop2 = "prop2:Search action";
      s.eVar5 = "eVar5:Anonymous visitor";
      // scraping configuration: prop2 is not configured, eVar6 is not in page
      config = {
        page_name: "s.pageName",
        search_string: "s.prop1",
        visitor_type: "s.eVar5",
        visitor_name: "s.eVar6"
      };
      var expected_data = {
        page_name: "s.pageName:Homepage",
        search_string: "prop1:Search string",
        visitor_type: "eVar5:Anonymous visitor"
      };
      capture_and_validate("s", expected_data);
    });
    it("uses existing value from utag_data object if it is defined", function() {
      // would be defined in the html. expect to pick up the value from
      // utag_data.page_name rather than s.pageName
      window.utag_data = {
        page_name: "utag_data:Homepage"
      };
      window.s = {
        pageName: "s.pageName:Homepage"
      };
      // Scraping implicitly uses the existing utag_data first.
      // Scraping from SiteCat has lower precedence.
      config = {
        page_name: "s.pageName"
      };
      var expected_data = {
        page_name: "utag_data:Homepage"
      };
      capture_and_validate(["utag_data","s"], expected_data);
    });
  });

  describe("Data layer migration : failover for missing values", function() {
    it("uses the highest priority value that is defined", function() {
      window.s = {
        pageName: "s.pageName:Homepage"
      };
      // first choice (digitalData) is not available
      config = {
        page_name: ["digitalData.page.pageName", "s.pageName"]
      };
      var expected_data = {
        page_name: "s.pageName:Homepage"
      };
      capture_and_validate("s", expected_data);
    });
    it("does not set the value if it is not defined in any of the data sources", function() {
      config = {
        missing_value: "not_a_real_variable"
      };
      var expected_data = {};
      capture_and_validate("not_a_real_variable", expected_data);
    });
  });

  describe("W3C digitalData : Unrolls arrays of objects into separate arrays", function() {
    beforeEach(function() {
      // 2 example product objects in the input for all of these tests
      window.digitalData = {
        color: ["red", "blue"],
        product: [{
          type: "camera",
          productInfo: {
            productName: "Nikon SLR Camera",
            // oh look there is no sku
            manufacturer: "Nikon"
          }
        }, {
          type: "accessory",
          productInfo: {
            productName: "Camera bag",
            sku: "sku23456",
            manufacturer: "Nikon"
          }
        }],
      };
    });
    it("uses the format 'digitalData.color[]' to select data from an array of strings", function() {
      config = {
        color: "digitalData.color[]"
      };
      var expected_data = {
        color: ["red", "blue"]
      };
      capture_and_validate("digitalData", expected_data);
    });
    it("uses the format 'digitalData.product[].field' to select a field from an array of objects", function() {
      config = {
        product_type: "digitalData.product[].type"
      };
      var expected_data = {
        product_type : ["camera", "accessory"]
      };
      capture_and_validate("digitalData", expected_data);
    });
    it("uses digitalData.product[].productInfo.field to dig deeper into an array of objects", function() {
      config = {
        product_name: "digitalData.product[].productInfo.productName"
      };
      var expected_data = {
        product_name : ["Nikon SLR Camera", "Camera bag"]
      };
      capture_and_validate("digitalData", expected_data);
    });
    it("handles missing fields in the array of objects", function() {
      config = {
        product_sku: "digitalData.product[].productInfo.sku"
      };
      var expected_data = {
        product_sku : ["" /* missing in page data */, "sku23456"]
      };
      capture_and_validate("digitalData", expected_data);
    });
  });
});


/**
 * Test support
 */

/*
      // would be defined in the html
      window.utag_data = { page_name : "utag_data:Homepage" };
      // scraping from SiteCat has lower precedence
      window.s = {
        pageName : "s.pageName:Homepage"
      };
      var config = {
        page_name : "s.pageName"
      };
      utag_data = utag_extn.import_datalayer.process(config, utag_data);
      expect(utag_data.page_name).to.equal("utag_data:Homepage");

*/

function capture_and_validate(data_sources, expected_data) {
  // 1) Check that config exists
  var expect = chai.expect;
  var utag = window.utag;
  expect(config).to.be.an("object", "Test error: Configuration object is missing");
  expect(utag).to.be.an("object", "Test error: utag is not defined");
  expect(utag_extn).to.be.an("object", "Test error: utag_extn namespace is not defined "
    + "- did the library file load?");
  // 2) Check what data is defined in the page
  if ("string" === typeof data_sources) {
    data_sources = [ data_sources ];
  }
  var page_data = {}, variable_name, i;
  for (i = 0; i < data_sources.length; i++) {
    variable_name = data_sources[i];
    page_data[variable_name] = window[variable_name];
  }
  // 3) Run the scraping
  var process = utag_extn.import_datalayer.process;
  expect(process).to.be.a("function", "utag_extn.import_datalayer.process() is not defined");
  var actual_data = process(config, window.utag_data);
  window.utag_data = actual_data;
  expect(actual_data).to.be.an("object", "utag_data should be an object");
  // 4) Assert output
  var message = "With config " + JSON.stringify(config) 
    + "\n  and page data " + JSON.stringify(page_data) + "\n";
  // console.log("Actual", JSON.stringify(actual_data));
  // console.log("Expected", JSON.stringify(expected_data));
  // console.log("Does it match?", (JSON.stringify(actual_data) == JSON.stringify(expected_data)))
  expect(JSON.stringify(actual_data)).to.equal(JSON.stringify(expected_data), message);
  // 5) Clean up page data
  for (i = 0; i < data_sources.length; i++) {
    variable_name = data_sources[i];
    delete window[variable_name];
  }
}