module "events_producers" {

    source = "./modules/events-producers"

    classified_censored_events_producer = {
        lambda_dist_dir = "../dist/events-producers/lambda-handlers"
        lambda_handler_name = "classified-censored-events-producer.handler"
    }

    application = "idempotent-consumers"
    environment = "sandbox"
}


module "events_consumers" {

    source = "./modules/events-consumers"

    classified_censored_events_consumer = {
        lambda_dist_dir = "../dist/events-consumers/lambda-handlers"
        lambda_handler_name = "classified-censored-events-consumer.handler"
    }

    classified_events_topic_arn = module.events_producers.classified_events_topic_arn

    application = "idempotent-consumers"
    environment = "sandbox"
}