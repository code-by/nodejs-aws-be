#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProductServiceStack } from "./productServiceStack";
import { ImportServiceStack } from "./importServiceStack";

const app = new cdk.App();
//new ProductServiceStack(app, "ProductServiceStack"); // CF stack name
new ImportServiceStack(app, "ImportServiceStack");
