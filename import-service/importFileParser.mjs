import csv from "csv-parser";
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const moveParsedFile = async (s3Client, bucketParams) => {

  console.log('* moveParsedFile *');

  try {
    const {Bucket: bucketName, Key: objectKey} = bucketParams;
    let result;

    console.log('bucketName:', bucketName);
    console.log('objectKey:', objectKey);

    const destinationKey = "parsed/" + objectKey.split('/')[1];

    const copyParams = {
      Bucket: bucketName,
      CopySource: encodeURIComponent(bucketName + "/" + objectKey),
      Key: destinationKey,
    };

    console.log('copyParams');
    console.log(copyParams);

    result = await s3Client.send(new CopyObjectCommand(copyParams));
    console.log('CopyObjectCommand result:');
    console.log(result);

    console.log('deleting');
    result = await s3Client.send(new DeleteObjectCommand(bucketParams));
    console.log('DeleteObjectCommand result:');
    console.log(result);

    return true;
  } catch (e) {
    console.log('error');
    console.log(e?.message || e);
  }
  
};


// get object of new object in s3 bucket and parse it in case it is csv file

export const handler = async (event) => {

  try {

    console.log('event:');
    console.log({...event});

    console.log('s3');
    console.log(event.Records[0].s3);

    const s3Client = new S3Client();

    const bucketName = event.Records[0].s3.bucket.name;
    const objectKey = event.Records[0].s3.object.key;

    console.log('record[0]');
    console.log(event.Records[0]);

    const params = {
      Bucket: bucketName,
      Key: decodeURIComponent(objectKey),
    };

    console.log('bucketName:', bucketName);
    console.log('objectKey:', objectKey);


    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    const readStream = response.Body;

    const results = [];

    const parseResult = await new Promise((resolve, reject) => {
      readStream
      .pipe(csv())
        .on('data', (chunk) => {
          results.push(chunk);
        })
        .on('end', async () => {
          console.log('results:');
          console.log([...results]);
          resolve(results);
        })
        .on('error', (e) => {
          console.log('error parsing ', objectKey);
          console.log(e?.message || 'unknown error');
          reject(e);
        })
    });

    if (parseResult) {
      console.log('csv data:');
      parseResult.map(i => console.log({...i}));
  
      await moveParsedFile(s3Client, params);
    }

  } catch (e) {
    console.log("some error happens");
    console.log(e?.message || 'unknown error');
  } finally {
    console.log('-- EOF --');
  }

};
