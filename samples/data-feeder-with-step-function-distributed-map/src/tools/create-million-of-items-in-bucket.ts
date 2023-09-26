
import { S3 } from "@aws-sdk/client-s3";
import { faker } from '@faker-js/faker';
import { hashToRange } from "./range";

const s3Client = new S3();

const PrefixRanges = 20_000;

const createRandomUser = (range: number) => {

  return {
    id: faker.string.uuid(),
    avatar: faker.image.avatar(),
    birthday: faker.date.birthdate(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    description: faker.lorem.lines(10),
    anotherDescription: faker.lorem.paragraphs(2),
    subscriptionTier: faker.helpers.arrayElement(['free', 'basic', 'business']),
    range
  };
}


(async () => {

  let batch : number[] = [];
  for(const item of Array(1_000_000).keys()) {
    if(batch.length == 2000) {
      await Promise.all(batch.map(async _ => {
        
        const randomUser = createRandomUser(item);
        const range = hashToRange(randomUser.id, PrefixRanges);

        const s = await s3Client.putObject({
          Key: `users2/${range}/${randomUser.id}.json`,
          Bucket: "cd-sandbox-a-bucket-to-test-feeder",
          Body: JSON.stringify(randomUser)
        });

        console.log({s, _});
        batch =  []

      }));
    } else {
      batch.push(item);
    }
  }

  
})();



