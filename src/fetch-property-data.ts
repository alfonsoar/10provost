import * as cheerio from "cheerio";
import * as fse from "fs-extra";

import { PropertyData } from "./types";

const BLOCK = "11505";
const LOT = "00001";
const DISTRICT = "0906";

(async function () {
  const allUnitsHtml = await fetchAllUnitsHtml();
  const allUnitsQualifiers = parseAllResidentialUnits(allUnitsHtml);

  const allUnitsDetails = await Promise.all(
    allUnitsQualifiers.map(async (unitQualifier) => {
      const rawDetailsPage = await fetchUnitDetailsHtml(unitQualifier);
      return initialParse(rawDetailsPage);
    })
  );

  const final = allUnitsDetails.reduce((result, item) => {
    const key = Object.keys(item)[0];
    result[key] = item[key];
    return result;
  }, {});

  fse.writeFile(
    "db.json",
    JSON.stringify(final, null, 2),
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
})();

async function fetchAllUnitsHtml() {
  const qualsResponse = await fetch(
    "https://taxrecords-nj.com/pub/cgi/inf.cgi",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        ms_user: "ctb09",
        passwd: "",
        srch_type: "1",
        select_cc: "0901",
        district: DISTRICT,
        adv: "1",
        out_type: "1",
        ms_ln: "1000",
        p_loc: "",
        owner: "",
        block: BLOCK,
        lot: "1",
        qual: "",
      }),
    }
  );

  return await qualsResponse.text();
}

function parseAllResidentialUnits(allUnitsHtml: string) {
  const $ = cheerio.load(allUnitsHtml);

  const qualValues: string[] = [];

  // Find all table rows and iterate through them
  $("tr").each((index, element) => {
    // Get the fourth td element (index 3) which contains the Qual value
    const qualCell = $(element).find("td").eq(3);
    const qualValue = qualCell.text().trim();

    // Add non-empty values to the array
    if (
      qualValue &&
      qualValue !== "&nbsp;" &&
      qualValue !== "Qual" &&
      qualValue.includes("C") &&
      qualValue !== "C8001"
    ) {
      qualValues.push(qualValue);
    }
  });
  return qualValues;
}

async function fetchUnitDetailsHtml(unitQualifier: string) {
  const response = await fetch(
    `https://taxrecords-nj.com/pub/cgi/m4.cgi?district=${DISTRICT}&l02=${DISTRICT}${BLOCK}____${LOT}____${unitQualifier}M`
  );
  return await response.text();
}

function initialParse(rawHtml: string) {
  const $ = cheerio.load(rawHtml);

  const result: PropertyData = {};

  const qual = $('tr:contains("Qual:") td:nth-child(2)').text().trim();
  const squareFoot = $('tr:contains("Square Ft:") td:nth-child(8)')
    .text()
    .trim();

  result[qual] = {
    "square foot": squareFoot,
    "sale history": {},
  };

  $("table:nth-of-type(2) tr:not(:first-child)").each((_, element) => {
    const date = $(element).find("td:nth-child(2)").text().trim();
    const price = parseInt(
      $(element).find("td:nth-child(5)").text().trim(),
      10
    );
    const grantee = $(element).find("td:nth-child(8)").text().trim();

    if (date && price && grantee) {
      result[qual]["sale history"][date] = {
        price,
        Grantee: grantee,
      };
    }
  });
  return result;
}
