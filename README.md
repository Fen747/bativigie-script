# Bativigie workers status update script

This script allows you to connect to the 'bativigie' mongoDB collection
in order to list and update the 'status' of all workers of type 'interim'
whose contract has already ended.

## Options

| Flag     | Alias | Type               | Optional | Description                                                                       |
| -------- | ----- | ------------------ | -------- | --------------------------------------------------------------------------------- |
| --uri    | -     | String / Mongo URI | -        | Set the connection URI of the database                                            |
| --update | -u    | Boolean            | yes      | Execute the update query to modify the matched documents                          |
| --test   | -t    | Boolean            | yes      | Execute the script against the 'test' database instead of 'bativigie'             |
| --copy   | -c    | Boolean            | yes      | If --test is set, copy the 'workers' collection from 'bativigie' to 'test' before |
| --help   | -h    | Boolean            | yes      | Show this usage manual                                                            |

## Installing deps

    npm install

## Examples

    // Count documents to update
    node script.js --uri="mongodb+srv://username:passsword@clusterName.url.mongodb.net/bativigie"

    // Copy documents to update into `test` database
    node script.js --uri="mongodb+srv://username:passsword@clusterName.url.mongodb.net/bativigie" -tc

    // Copy documents to update into `test` database and update them
    node script.js --uri="mongodb+srv://username:passsword@clusterName.url.mongodb.net/bativigie" -tcu

    // Update matching workers on production database
    node script.js --uri="mongodb+srv://username:passsword@clusterName.url.mongodb.net/bativigie" -u

## Logs

Logs can be found at `./logs/.modified_ids_xxxxxx.json` where `xxxxxx` is the timestamp used to detect documents to update
Logs from the `test` database are suffixed with `.test.json`
