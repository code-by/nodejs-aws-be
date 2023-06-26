#!/bin/bash

# will delete all items in table
# tested on node v.18 and AWS CLI v.2.11
TABLE_NAME="products"
PKEY="id"

KEYS=$(aws dynamodb scan --table-name $TABLE_NAME --query 'Items[*].id' --output text --return-consumed-capacity "NONE" --no-cli-pager --no-paginate)

for KEY in $KEYS; do
    echo DELETE item with key: $KEY\;
    aws dynamodb delete-item --table-name $TABLE_NAME --key "{\"$PKEY\":{\"S\":\"$KEY\"}}"
done