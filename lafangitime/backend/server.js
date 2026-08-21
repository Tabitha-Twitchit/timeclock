// dependencies
require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors({ origin:["http://127.0.0.1:5500", "http://127.0.0.1:1430", "tauri://localhost", "http://tauri.localhost"]}));
const fs = require("fs");

app.get("/config", (req, res) => {
  const configPath = require("path").join(__dirname, "config.json");
  fs.readFile(configPath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({error: "Could not read config"});
    }
    res.type("application/json").send(data);
  });
});

let currentAccessToken = null;
let tokenExpiresAt = 0;

async function getValidAccessToken() {
  // if there is a good token, reuse it
  if (currentAccessToken && Date.now() < tokenExpiresAt) {
    return currentAccessToken;
  }

  // otherwise get a new one
  const url =
    "https://accounts.zoho.com/oauth/v2/token" +
    "?client_id=" +
    process.env.ZOHO_CLIENT_ID +
    "&client_secret=" +
    process.env.ZOHO_CLIENT_SECRET +
    "&grant_type=refresh_token" +
    "&refresh_token=" +
    process.env.ZOHO_REFRESH_TOKEN;

  const response = await fetch(url, { method: "POST" });
  const data = await response.json();

  currentAccessToken = data.access_token;
  // 60 sec buffer between expirey and refresh
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return currentAccessToken;
}

app.post("/submit-entry", async (req, res) => {
  const rowData = req.body;
  const entry = rowData[0];
  
  // debug
  // console.log("Received rowData:", rowData); 
  
  // ensure data is structured properly, throws error if not.
  if (
    !rowData ||
    !entry ||
    !entry.Date ||
    !entry.User ||
    !entry.Client ||
    !entry.Job
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const url =
    "https://sheet.zoho.com/api/v2/" +
    process.env.ZOHO_RESOURCE_ID +
    "?method=worksheet.records.add" +
    "&worksheet_name=" +
    process.env.ZOHO_WORKSHEET_NAME +
    "&json_data=" +
    encodeURIComponent(JSON.stringify(rowData));

  try {
    const accessToken = await getValidAccessToken();
    const zohoResponse = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Zoho-oauthtoken " + accessToken },
    });
    const data = await zohoResponse.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reach Zoho" });
  }
});

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
