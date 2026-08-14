import { SQSEvent } from "aws-lambda";
import { createFakeSQSEnvelope } from "@cm-connector/lambda-handlers/fakes/create-fake-sqs-envelope";
import { createFakeLambdaContext } from "@cm-connector/lambda-handlers/fakes/fake-lambda-context";
import { v4 as uuidv4 } from "uuid";

import createdEvent from "./fakes/CREATED_NBH1FR1.json";
import deletedEvent from "./fakes/DELETED_NBH1FR1.json";

const createOrUpdateGeo = jest.fn();
const markGeoAsDeleted = jest.fn();

jest.mock("cm-consumer/adapters/geo-materialized-view-dynamodb", () => ({
  createOrUpdateGeo: (...args: unknown[]) => createOrUpdateGeo(...args),
  markGeoAsDeleted: (...args: unknown[]) => markGeoAsDeleted(...args),
}));

import { lambdaHandler } from "./process-cm-connector-geo-events-fifo";

describe("process cm connector geo events fifo lambda", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should parse a created/updated event from the fake repository and dispatch it to createOrUpdateGeo", async () => {

    // arrange
    const record = createFakeSQSEnvelope(uuidv4(), createdEvent);
    const sqsEvent: SQSEvent = { Records: [record] };

    // act
    await lambdaHandler(sqsEvent, createFakeLambdaContext() as any);

    // assert
    expect(createOrUpdateGeo).toHaveBeenCalledTimes(1);
    expect(createOrUpdateGeo).toHaveBeenCalledWith(createdEvent.data.id, createdEvent.data, createdEvent.data);
    expect(markGeoAsDeleted).not.toHaveBeenCalled();
  });

  test("should parse a deleted event from the fake repository and dispatch it to markGeoAsDeleted", async () => {

    // arrange
    const record = createFakeSQSEnvelope(uuidv4(), deletedEvent);
    const sqsEvent: SQSEvent = { Records: [record] };

    // act
    await lambdaHandler(sqsEvent, createFakeLambdaContext() as any);

    // assert
    expect(markGeoAsDeleted).toHaveBeenCalledTimes(1);
    expect(markGeoAsDeleted).toHaveBeenCalledWith({
      id: deletedEvent.data.id,
      updateDate: deletedEvent.data.updateDate,
      classified: deletedEvent.data,
    });
    expect(createOrUpdateGeo).not.toHaveBeenCalled();
  });
});
