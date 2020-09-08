# Bativigie workers status update script

This script allows you to connect to the 'bativigie' mongoDB collection
in order to list and update the 'status' of all workers of type 'interim'
whose contract has already ended.

## Options

-   --uri String [MANDATORY] Execute the update query to modify the matched documents
-   --update -u Boolean Execute the update query to modify the matched documents
-   --test -t Boolean Execute the script against the 'test' database instead of 'bativigie'
-   --copy -c Boolean If --test is set, copy the 'workers' collection from 'bativigie' to 'test' before
-   --help -h Boolean Show this usage manual

## Examples

    // Count documents to update
    node script.js --uri="mongodb+srv://username:passsword@clusterName.url.mongodb.net/bativigie"

    // Copy documents to update into `test` database
    node script.js --uri="mongodb+srv://username:passsword@clusterName.url.mongodb.net/bativigie -tc"

    // Copy documents to update into `test` database and update them
    node script.js --uri="mongodb+srv://username:passsword@clusterName.url.mongodb.net/bativigie -tcu"

    // Update matching workers on production database
    node script.js --uri="mongodb+srv://username:passsword@clusterName.url.mongodb.net/bativigie -u"
