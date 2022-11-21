const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let db = null;
const initializerOfDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running.....");
    });
  } catch (e) {
    console.log(`Db error: ${e.message}`);
    process.exit(1);
  }
};
initializerOfDbAndServer();

function convert(ob) {
  return {
    stateId: ob.state_id,
    stateName: ob.state_name,
    population: ob.population,
  };
}
function convert1(ob) {
  return {
    districtId: ob.district_id,
    districtName: ob.district_name,
    stateId: ob.state_id,
    cases: ob.cases,
    cured: ob.cured,
    active: ob.active,
    deaths: ob.deaths,
  };
}

//1
app.get("/states", async (Request, response) => {
  const getAllQuery = `
  SELECT * FROM 
  state;`;
  const result = await db.all(getAllQuery);
  response.send(result.map(convert));
});

//2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAllQuery = `
  SELECT * FROM 
  state
  WHERE 
  state_id = ${stateId};`;
  const result = await db.get(getAllQuery);
  response.send(convert(result));
});

//3
app.post("/districts/", async (request, response) => {
  const addDetails = request.body;
  const addQuery = `
    INSERT INTO 
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES (
        '${addDetails.districtName}',
        ${addDetails.stateId},
        ${addDetails.cases},
        ${addDetails.cured},
        ${addDetails.active},
        ${addDetails.deaths}
    );`;
  const result = await db.run(addQuery);
  response.send("District Successfully Added");
});
//4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getAllQuery = `
  SELECT * FROM 
  district
  WHERE 
  district_id = ${districtId};`;
  const result = await db.get(getAllQuery);
  response.send(convert1(result));
});
//5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getAllQuery = `
  DELETE FROM 
  district
  WHERE 
  district_id = ${districtId};`;
  const result = await db.get(getAllQuery);
  response.send("District Removed");
});
//6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const requestBody = request.body;
  const addDistrictQuery = `
    UPDATE
    district
    SET
    district_name='${requestBody.districtName}',
    state_id=${requestBody.stateId},
    cases=${requestBody.cases},
    cured=${requestBody.cured},
    active=${requestBody.active},
    deaths=${requestBody.deaths}
    WHERE
    district_id = ${districtId};
    `;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Details Updated");
});

//7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
    SELECT SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
    FROM district 
    WHERE 
    state_id=${stateId};
            `;
  const result = await db.get(getQuery);
  response.send(result);
});
//8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `
    SELECT state_name
    FROM district join state on state.state_id = district.state_id
    WHERE 
    district.district_id = ${districtId};
            `;
  const result = await db.get(getQuery);
  response.send(convert(result));
});
module.exports = app;
