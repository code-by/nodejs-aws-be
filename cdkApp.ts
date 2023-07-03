#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProductServiceStack } from "./productServiceStack";
import { ImportServiceStack } from "./importServiceStack";
import { AuthorizationServiceStack } from "./authorizationServiceStack";

const app = new cdk.App();

new ProductServiceStack(app, "ProductServiceStack"); // CF stack name
new ImportServiceStack(app, "ImportServiceStack");
new AuthorizationServiceStack(app, "AuthorizationServiceStack");
