/**
 * Tests the Capture Datalayer extension.
 * The easiest way to run this is to open capture-datalayer-test.html
 * in a browser.
 */

// Tealium goodies
/*global utag, utag_data */

// Mocha test functionality 
/*global chai, describe, beforeEach, it, expect */
"use strict";

describe("The 'Capture Data Layer' extension", function() {
  beforeEach(function() {
    delete window.utag_data;
  });

  describe("Simple, single variable capture", function() {
    it("captures a top-level variable (pageName)", function() {
      window.pageName = "pageName:Homepage";
      var config = {
        page_name: "pageName"
      };
      var expected_data = {
        page_name: "pageName:Homepage"
      };
      capture_and_validate(config, "pageName", expected_data);
    });
    it("captures a dotted object variable (s.pageName)", function() {
      // defined in html page
      window.s = {};
      window.s.pageName = "s.pageName:Homepage";
      // scraping configuration
      var config = {
        page_name: "s.pageName"
      };
      var expected_data = {
        page_name: "s.pageName:Homepage"
      };
      capture_and_validate(config, "s", expected_data);
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
      var config = {
        page_name: "s.pageName"
      };
      var expected_data = {
        page_name: "utag_data:Homepage"
      };
      capture_and_validate(config, ["utag_data","s"], expected_data);
    });
  });

  describe("Failover for missing values", function() {
    it("uses the highest priority value that is defined", function() {
      window.s = {
        pageName: "s.pageName:Homepage"
      };
      // first choice (digitalData) is not available
      var config = {
        page_name: ["digitalData.page.pageName", "s.pageName"]
      };
      var expected_data = {
        page_name: "s.pageName:Homepage"
      };
      capture_and_validate(config, "s", expected_data);
    });
    it("does not set the value if it is not defined in any of the data sources", function() {
      var config = {
        missing_value: "not_a_real_variable"
      };
      var expected_data = {};
      capture_and_validate(config, "not_a_real_variable", expected_data);
    });
  });

  describe("Unrolls arrays of objects into separate arrays", function() {
    beforeEach(function() {
      // 2 example product objects in the input for all of these tests
      window.digitalData = {
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
        tags: ["red", "blue"]
      };
    });
    it("uses the format 'digitalData.tags[]' to select data from an array of strings", function() {
      var config = {
        tags: "digitalData.tags[]"
      };
      var expected_data = {
        tags: ["red", "blue"]
      };
      capture_and_validate(config, "digitalData", expected_data);
    });
    it("uses the format 'digitalData.product[].field' to select a field from an array of objects", function() {
      var config = {
        product_type: "digitalData.product[].type"
      };
      var expected_data = {
        product_type : ["camera", "accessory"]
      };
      capture_and_validate(config, "digitalData", expected_data);
    });
    it("uses digitalData.product[].productInfo.field to dig deeper into an array of objects", function() {
      var config = {
        product_name: "digitalData.product[].productInfo.productName"
      };
      var expected_data = {
        product_name : ["Nikon SLR Camera", "Camera bag"]
      };
      capture_and_validate(config, "digitalData", expected_data);
    });
    it("handles missing fields in the array of objects", function() {
      var config = {
        product_sku: "digitalData.product[].productInfo.sku"
      };
      var expected_data = {
        product_sku : ["" /* missing in page data */, "sku23456"]
      };
      capture_and_validate(config, "digitalData", expected_data);
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
      utag_data = utag.extn.capture_datalayer.process(config, utag_data);
      expect(utag_data.page_name).to.equal("utag_data:Homepage");

*/

function capture_and_validate(config, data_sources, expected_data) {
  // 1) Check that config exists
  var expect = chai.expect;
  expect(config).to.be.an("object", "Test error: Configuration object is missing");
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
  var process = utag.extn.capture_datalayer.process;
  expect(process).to.be.a("function", "utag.extn.capture_datalayer.process() is not defined");
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