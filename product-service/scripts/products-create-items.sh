#!/bin/bash

cd productServiceCDK/scripts/
aws dynamodb batch-write-item --request-items file://test-items.json