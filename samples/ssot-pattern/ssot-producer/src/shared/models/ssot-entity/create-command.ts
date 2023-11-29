import { z } from "zod"

export default z.intersection(z.object({ "estateType": z.string(), "distributionType": z.string() }), z.object({ "metadata": z.object({ "objectVersion": z.number(), "dataModelVersion": z.string(), "partition": z.string() }) }))
