# timeclock
Simple standalone timeclock that updates to Zoho spreadsheet.

## Setup

- "demo-config.json" provides source array for employees, clients and specific jobs. 
change the name to "config.json" and it will work in the scripts. "config.json" is 
gitignored so private clients are unexposed in the repo.
- "npm install" in the backend directory to install CORS, dotenv, express dependencies
- setup your ".env" file with the following structure:

ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REFRESH_TOKEN=your_token_here
ZOHO_RESOURCE_ID=your_resource_ID_from_the_public_URL
ZOHO_WORKSHEET_NAME=sheet1_or_other_sheet_number

- "node server.js" to start the server, which receeives the POST from zoho_api.js
- Front end "index.html" runs in vscode live server
