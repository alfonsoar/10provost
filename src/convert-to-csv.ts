import { PropertyData } from "./types";
import db from "../db.json";

import * as fse from "fs-extra";

(function () {
  convertToCsv(db);
})();

function convertToCsv(data: PropertyData) {
  const csv = ["Unit,Total Square Foot,Sale Date,Price,Buyer"];
  for (const [unit, details] of Object.entries(data)) {
    for (const [saleDate, saleDetails] of Object.entries(
      details["sale history"]
    )) {
      csv.push(
        `${unit},${details["square foot"]},${saleDate},${saleDetails.price},"${saleDetails.Grantee}"`
      );
    }
  }

  fse.writeFile("sales-data.csv", csv.join("\n"), "utf8", function (err) {
    if (err) {
      console.log(
        "Some error occured - file either not saved or corrupted file saved."
      );
    } else {
      console.log("It's saved!");
    }
  });
}
