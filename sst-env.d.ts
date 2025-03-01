/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */

declare module "sst" {
  export interface Resource {
    "Aurora": {
      "clusterArn": string
      "database": string
      "host": string
      "password": string
      "port": number
      "reader": string
      "secretArn": string
      "type": "sst.aws.Aurora"
      "username": string
    }
    "Bucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "Bun": {
      "service": string
      "type": "sst.aws.Service"
    }
    "Email": {
      "configSet": string
      "sender": string
      "type": "sst.aws.Email"
    }
    "GOOGLE_CLIENT_ID": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GOOGLE_CLIENT_SECRET": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "Vpc": {
      "bastion": string
      "type": "sst.aws.Vpc"
    }
  }
}
/// <reference path="sst-env.d.ts" />

import "sst"
export {}