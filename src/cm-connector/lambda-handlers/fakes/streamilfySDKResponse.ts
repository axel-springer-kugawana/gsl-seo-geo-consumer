import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import { Readable } from "stream";

export const sdkStreamifyObject = <T>(object: T) => {

    const stream = new Readable();
    stream.push(JSON.stringify(object));
    stream.push(null);
    
    const sdkStream = sdkStreamMixin(stream);
    return sdkStream;

}

