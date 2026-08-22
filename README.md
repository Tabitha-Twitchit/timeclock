# lafangitime
Source code for simple standalone timeclock for PC / Mac / Linux
Clock in / out, fields for client, job and notes.
Updates to Zoho sheet for record keeping.

## Initial Setup

- Instal node.js before use (nodejs.org), needed to run local backen.
- Install the app for your OS. get the latest build at "github.com/Tabitha-Twitchit/timeclock/releases"
- Select the latest update, and "artifact" (build) for your OS.
- "demo-config.json" provides source array for employees, clients and specific jobs. 
change the name to "config.json" and it will work in the scripts. "config.json" is 
gitignored so private clients are unexposed in the repo. Lives in the "backend" folder
along.
- "npm install" in the backend directory to install CORS, dotenv, express dependencies
- create your ".env" file with the following structure so the variables can be called 
in the server.js script:

ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REFRESH_TOKEN=your_token_here
ZOHO_RESOURCE_ID=your_resource_ID_from_the_public_URL
ZOHO_WORKSHEET_NAME=sheet1_or_other_sheet_number


