# FluentFlex

git clone git@github.com:NeshkaD/FluentFlex.git

This project has two sub directories: (1) front-end (2) back-end

Please go to those directories and read the instructions to run those directories


Order of instructions:
1. Run the MySQL database and create the schema
2. Run the back end
3. Run the front end

To run the MySQL database:
Make sure database is running. Check instructions for your particular OS.
In MySQL DB:
File > Open SQL Script > FluentFlex\back-end\sql\generate_db.sql
Execute the SQL script


To run the back-end:
cd FluentFlex\back-end
npm install
node server.js

To run the front end:
cd FluentFlex\front-end
npm install
ng serve
Front end should run on http://localhost:4200/