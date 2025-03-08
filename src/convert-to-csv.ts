import { PropertyData } from "./types";

import * as fse from "fs-extra";

const BLOCK = "11505";

(async function () {
  const db = await import(`../db-${BLOCK}.json`);
  convertToCsv(db.default);
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

  fse.writeFile(
    `sales-data-${BLOCK}.csv`,
    csv.join("\n"),
    "utf8",
    function (err) {
      if (err) {
        console.log(
          "Some error occured - file either not saved or corrupted file saved."
        );
      } else {
        console.log("It's saved!");
      }
    }
  );
}
