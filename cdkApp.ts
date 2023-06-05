#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProductServiceStack } from "./productServiceStack";

const app = new cdk.App();
new ProductServiceStack(app, "ProductServiceStack"); // CF stack name
